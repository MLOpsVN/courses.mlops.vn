<figure>
    <img src="../../assets/images/mlops-crash-course/data-pipeline/pipeline-everywhere.jpeg" loading="lazy"/>
    <figcaption>Photo by <a href="https://snehamehrin22.medium.com/?source=post_page-----fe14643c67fd--------------------------------">Sneha Mehrin</a> on <a href="https://snehamehrin22.medium.com/how-to-build-a-technical-design-architecture-for-an-analytics-data-pipeline-fe14643c67fd">Medium</a></figcaption>
</figure>

## Giới thiệu

Ở bài học trước, chúng ta đã làm quen với feature store, Feast và dùng command `feast apply` để tạo ra feature definition ở đường dẫn `data_pipeline/feature_repo/registry/local_registry.db`. Trong bài học này chúng ta sẽ sử dụng folder này để cấu hình client `store` giao tiếp với feature store như sau:

```py linenums="1"
from feast import FeatureStore
store = FeatureStore(repo_path="../feature_repo")  # (1)
```

1.  Khởi tạo client _store_ để giao tiếp với feature store

Client này sẽ được sử dụng ở nhiều bước khác nhau bao gồm **1**, **2**, **3**, **4**, **5** như hình dưới đây:

<img src="../../assets/images/mlops-crash-course/data-pipeline/Feast_architecture.png" loading="lazy" />

## Môi trường phát triển

Ngoài Feast, bài học này sẽ sử dụng thêm Airflow, bạn vào repo `mlops-crash-course-platform/` và start service này như sau:

```bash
bash run.sh airflow up
```

## Các tương tác chính với Feast

Chúng ta có 6 tương tác chính với Feast như sau:

1\. Materialize feature từ offline sang online store để đảm bảo online store lưu trữ feature mới nhất

```py title="data_pipeline/scripts/feast_helper.sh" linenums="1"
cd feature_repo
feast materialize-incremental $(date +%Y-%m-%d)
```

???+tip

    Để hiểu rõ hơn về `materialize`, giả sử rằng ở offline store chúng ta có 3 record của ID 1001 như sau:

    | datetime   | driver_id | conv_rate | acc_rate | avg_daily_trips | created   |
    | ------     | ------    | ------    | ------   | ------          | ------    |
    | 2021-07-13 11:00:00+00:00   |    1001 |  0.852406 | 0.059147       |       340 | 2021-07-28 11:08:04.802 |
    | 2021-08-10 12:00:00+00:00   |    1001 |  0.571599 | 0.244896       |       752 | 2021-07-28 11:08:04.802 |
    | 2021-07-13 13:00:00+00:00   |    1001 |  0.929023 | 0.479821       |       716 | 2021-07-28 11:08:04.802 |

    Khi chúng ta chạy command `feast materialize 2021-08-07T00:00:00`, thì dữ liệu có `datetime` mới nhất mà trước thời điểm `2021-08-07T00:00:00` sẽ được cập nhật vào online store. Đó chính là record **thứ 3** ở bảng trên.

    | datetime   | driver_id | conv_rate | acc_rate | avg_daily_trips | created   |
    | ------     | ------    | ------    | ------   | ------          | ------    |
    | 2021-07-13 13:00:00+00:00   |    1001 |  0.929023 | 0.479821    |       716 | 2021-07-28 11:08:04.802 |                                                                                        


2\. Data scientist, training pipeline hoặc offline batch serving pipeline kéo features về để train model

```py title="data_pipeline/examples/get_historical_features.py" linenums="1"
entity_df = pd.DataFrame.from_dict(
    {
        "driver_id": [1001, 1002, 1003],
        "datetime": [
            datetime(2022, 5, 11, 11, 59, 59),
            datetime(2022, 6, 12, 1, 15, 10),
            datetime.now(),
        ],
    }
)
training_df = store.get_historical_features(
    entity_df=entity_df,
    features=["driver_stats:acc_rate", "driver_stats:conv_rate"],
).to_df()
print(training_df.head())
```

3\. Kéo features mới nhất tương ứng với các IDs trong request API để cho qua model dự đoán

```py title="data_pipeline/examples/get_online_features.py" linenums="1"
features = store.get_online_features(
    features=[
        "driver_stats:acc_rate",
        "driver_stats:conv_rate"
    ],
    entity_rows=[
        {
            "driver_id": 1001,
        }
    ],
).to_dict(include_event_timestamps=True)

def print_online_features(features):
    for key, value in sorted(features.items()):
        print(key, " : ", value)

print_online_features(features)
```

4\. Đẩy stream feature vào offline store

```py title="data_pipeline/src/stream_to_stores/processor.py" linenums="1"
def preprocess_fn(rows: pd.DataFrame):
    print(f"df columns: {rows.columns}")
    print(f"df size: {rows.size}")
    print(f"df preview:\n{rows.head()}")
    return rows

ingestion_config = SparkProcessorConfig(mode="spark", source="kafka", spark_session=spark, processing_time="30 seconds", query_timeout=15)
sfv = store.get_stream_feature_view("driver_stats_stream")

processor = get_stream_processor_object(
    config=ingestion_config,
    fs=store,
    sfv=sfv,
    preprocess_fn=preprocess_fn,
)

processor.ingest_stream_feature_view(PushMode.OFFLINE)
```

5\. Đẩy stream feature vào online store

```py linenums="1"
processor.ingest_stream_feature_view()
```

7\. ETL pipeline cập nhật dữ liệu của offline store

???+ tip

    Ở tương tác 2., thông thường các Data Scientist sẽ kéo dữ liệu từ feature store để:

    - thực hiện POC
    - thử nghiệm với các feature khác nhằm mục đích cải thiện model

Ở công đoạn xây dựng data pipeline, chúng ta sẽ xây dựng pipeline cho các tương tác 1., 4., 5., 7.

## Xây dựng các pipelines

### ETL pipeline

Để tạo ra một Airflow pipeline, thông thường chúng ta sẽ làm theo trình tự sau:

1.  Định nghĩa _DAG_ cho pipeline (line 1-8)
1.  Viết các task cho pipeline, ví dụ: _ingest_task_, _clean_task_ và _explore_and_validate_task_ (line 9-25)
1.  Viết thứ tự chạy các task (line 27)
1.  Chạy lệnh sau để build Docker image cho các pipeline component, và copy file code DAG sang folder `airflow/run_env/dags/data_pipeline` của repo clone từ [MLOps Crash course platform](https://github.com/MLOpsVN/mlops-crash-course-platform)

    ```bash
    cd data_pipeline
    make build_image
    # Đảm bảo Airflow server đã chạy
    make deploy_dags # (1)
    ```

    1.  Copy `data_pipeline/dags/*` vào folder `dags` của Airflow

    DAG dưới đây thể hiện ETL pipeline.

    ```py title="data_pipeline/dags/db_to_offline_store.py" linenums="1"
    with DAG(
        dag_id="db_to_offline_store", # (1)
        default_args=DefaultConfig.DEFAULT_DAG_ARGS, # (2)
        schedule_interval="@once",  # (3)
        start_date=pendulum.datetime(2022, 1, 1, tz="UTC"), # (4)
        catchup=False,  # (5)
        tags=["data_pipeline"],
    ) as dag:
        ingest_task = DockerOperator(
            task_id="ingest_task",
            **DefaultConfig.DEFAULT_DOCKER_OPERATOR_ARGS,
            command="/bin/bash -c 'cd src/db_to_offline_store && python ingest.py'",  # (6)
        )

        clean_task = DockerOperator(
            task_id="clean_task",
            **DefaultConfig.DEFAULT_DOCKER_OPERATOR_ARGS,
            command="/bin/bash -c 'cd src/db_to_offline_store && python clean.py'",
        )

        explore_and_validate_task = DockerOperator(
            task_id="explore_and_validate_task",
            **DefaultConfig.DEFAULT_DOCKER_OPERATOR_ARGS,
            command="/bin/bash -c 'cd src/db_to_offline_store && python explore_and_validate.py'",
        )

        ingest_task >> clean_task >> explore_and_validate_task  # (7)
    ```

    1.  Định nghĩa tên pipeline hiển thị ở trên Airflow dashboard
    2.  Định nghĩa pipeline owner, số lần retry pipeline, và khoảng thời gian giữa các lần retry
    3.  Lịch chạy pipeline, ở đây `@once` là một lần chạy, bạn có thể thay bằng cron expression ví dụ như 0 0 1 \* \*
    4.  Ngày bắt đầu chạy pipeline theo múi giờ UTC
    5.  Nếu **start_date** là ngày 01/01/2022, ngày deploy/turn on pipeline là ngày 02/02/2022, và **schedule_interval** là @daily thì sẽ không chạy các ngày trước 02/02/2022 nữa
    6.  Command chạy trong docker container cho bước này
    7.  Định nghĩa thứ tự chạy các bước của pipeline: đầu tiên là **ingest** sau đó tới **clean** và cuối cùng là **explore_and_validate**

    ???+ info

        Do chúng ta dùng DockerOperator để tạo _task_ nên cần phải build image chứa code và môi trường trước, sau đó sẽ truyền tên image vào `DEFAULT_DOCKER_OPERATOR_ARGS` trong từng pipeline component (ví dụ như line 11). Dockerfile để build image bạn có thể tham khảo tại `data_pipeline/deployment/Dockerfile`

    Biến `DefaultConfig.DEFAULT_DOCKER_OPERATOR_ARGS` chứa các config như sau:

    ```python linenums="1" title="data_pipeline/dags/utils.py"
    DEFAULT_DOCKER_OPERATOR_ARGS = {
        "image": f"{AppConst.DOCKER_USER}/mlops_crash_course/data_pipeline:latest", # (1)
        "api_version": "auto",  # (2)
        "auto_remove": True, # (3)
        "mounts": [
            Mount(
                source=AppPath.FEATURE_REPO.absolute().as_posix(), # (4)
                target="/data_pipeline/feature_repo", # (5)
                type="bind", # (6)
            ),
        ],
    }
    ```

    1. Docker image dùng cho task
    2. Tự động xác định Docker engine API version
    3. Tự động dọn dẹp container sau khi exit
    4. Folder ở máy local, bắt buộc là đường dẫn tuyệt đối
    5. Folder nằm trong docker container
    6. Kiểu bind, đọc thêm [ở đây](https://docs.docker.com/storage/#choose-the-right-type-of-mount)

1.  Đăng nhập vào Airflow tại <http://localhost:8088>, account `airflow`, password `airflow`, các bạn sẽ thấy một DAG với tên _db_to_offline_store_, 2 DAG bên dưới chính là những pipeline còn lại trong data pipelines (đề cập ở bên dưới).

    <img src="../../assets/images/mlops-crash-course/data-pipeline/airflow1.png" loading="lazy" />

1.  Đặt Airflow Variable `MLOPS_CRASH_COURSE_CODE_DIR` bằng đường dẫn tuyệt đối tới folder `mlops-crash-course-code/`. Tham khảo [hướng dẫn này](https://airflow.apache.org/docs/apache-airflow/stable/howto/variable.html) về cách đặt Airflow Variable.

    !!! info

        Airflow Variable `MLOPS_CRASH_COURSE_CODE_DIR` được dùng trong file `data_pipeline/dags/utils.py`. Variable này chứa đường dẫn tuyệt đối tới folder `mlops-crash-course-code/`, vì `DockerOperator` yêu cầu `Mount Source` phải là đường dẫn tuyệt đối.

1.  Kích hoạt data pipeline và đợi kết quả

    <img src="../../assets/images/mlops-crash-course/data-pipeline/airflow4.png" loading="lazy" />

1.  Xem thứ tự các task của pipeline này như sau:

    <img src="../../assets/images/mlops-crash-course/data-pipeline/airflow2.png" loading="lazy" />

Tương tự như ETL pipeline, chúng ta sẽ code tiếp _Feast materialize pipeline_ và _Stream to stores pipeline_ như bên dưới.

### Feast materialize pipeline

Materialize dữ liệu từ _offline_ qua _online_ giúp làm mới dữ liệu ở _online store_

```py title="data_pipeline/dags/materialize_offline_to_online.py" linenums="1"
with DAG(
    dag_id="materlize_offline_to_online",
    default_args=DefaultConfig.DEFAULT_DAG_ARGS,
    schedule_interval="@once",
    start_date=pendulum.datetime(2022, 1, 1, tz="UTC"),
    catchup=False,
    tags=["data_pipeline"],
) as dag:
    materialize_task = DockerOperator(
        task_id="materialize_task",
        **DefaultConfig.DEFAULT_DOCKER_OPERATOR_ARGS,
        command="/bin/bash ./scripts/feast_helper.sh materialize",
    )
```

### Stream to stores pipeline

Bạn thậm chí có thể làm feature mới hơn bằng cách ghi dữ liệu trực tiếp từ stream source vào _offline_ và _online store_

```py title="data_pipeline/dags/stream_to_stores.py" linenums="1"
with DAG(
    dag_id="stream_to_stores",
    default_args=DefaultConfig.DEFAULT_DAG_ARGS,
    schedule_interval="@once",
    start_date=pendulum.datetime(2022, 1, 1, tz="UTC"),
    catchup=False,
    tags=["data_pipeline"],
) as dag:
    stream_to_online_task = DockerOperator(
        task_id="stream_to_online_task",
        command="/bin/bash -c 'cd src/stream_to_stores && python ingest.py --store online'",
        **DefaultConfig.DEFAULT_DOCKER_OPERATOR_ARGS,
    )

    stream_to_offline_task = DockerOperator(
        task_id="stream_to_offline_task",
        **DefaultConfig.DEFAULT_DOCKER_OPERATOR_ARGS,
        command="/bin/bash -c 'cd src/stream_to_stores && python ingest.py --store offline'",
    )
```

## Tổng kết

Ở bài học vừa rồi, chúng ta đã sử dụng Feast SDK để lưu trữ và lấy feature từ feature store. Để đảm bảo feature luôn ở trạng thái mới nhất có thể, chúng ta cũng đã xây dựng các Airflow pipeline để cập nhật dữ liệu định kỳ cho các store.

Bài học này đồng thời cũng khép lại chuỗi bài về data pipeline, hy vọng bạn có thể vận dụng các kiến thức đã học để vận hành hiệu quả các luồng dữ liệu và luồng feature của mình.

## Tài liệu tham khảo

- <https://feast.dev/>
- <https://airflow.apache.org/docs/apache-airflow/stable/tutorial/index.html>
