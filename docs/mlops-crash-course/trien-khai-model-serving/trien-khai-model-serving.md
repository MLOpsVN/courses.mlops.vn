## Mục tiêu

Trong bài này, chúng ta sẽ viết code để triển khai batch serving pipeline và xây dựng RESTful API cho online serving. Chi tiết về hai loại serving này, mời các bạn xem lại bài trước [ở đây](../../trien-khai-model-serving/tong-quan-model-serving). Source code của bài này đã được tải lên Github repo [mlops-crash-course-code](https://github.com/MLOpsVN/mlops-crash-course-code).

## Batch serving

Batch serving sẽ được triển khai dưới dạng một Airflow DAG với các task như hình dưới:

TODO: Vẽ ảnh

Lưu ý, trong quá trình chạy code cho tất cả các phần dưới đây, giả sử rằng folder gốc nơi chúng ta làm việc là folder `model_serving`.

### Cài đặt môi trường phát triển

Để quá trình phát triển thuận tiện, chúng ta cần xây dựng môi trường phát triển ở máy local. Các library các bạn cần cài đặt cho môi trường phát triển được đặt tại `model_serving/dev_requirements.txt`. Các bạn có thể dùng `virtualenv`, `conda` hoặc bất kì tool nào để cài đặt môi trường phát triển.

Sau khi cài đặt môi trường phát triển, chúng ta cần làm 2 việc sau.

1. Copy file `model_serving/.env-example`, đổi tên thành `model_serving/.env`. File này chứa các config cần thiết cho việc triển khai model serving. Các bạn có thể sửa nếu cần.

1. Copy file `model_serving/deployment/.env-example`, đổi tên thành `model_serving/deployment/.env`. File này chứa các config cần thiết cho việc triển khai việc triển khai model serving. Các bạn có thể sửa nếu cần.

1. Set env var `MODEL_SERVING_DIR` bằng đường dẫn tuyệt đối tới folder `model_serving`. Env var này là để hỗ trợ việc chạy python code trong folder `model_serving/src`.

```bash
export MODEL_SERVING_DIR="path/to/mlops-crash-course-code/model_serving"
```

### Cập nhật Feature Store

Task này được thực hiện giống như task **Cập nhật Feature Store** ở bài [Xây dựng training pipeline](../../xay-dung-training-pipeline/xay-dung-pipeline/#cap-nhat-feature-store). Mời các bạn xem lại nếu cần thêm giải thích chi tiết về mục đích của task này.

Đầu tiên, các bạn cần triển khai code của Feature Store từ `data_pipeline/feature_repo` sang `model_serving/feature_repo`, bằng cách chạy các lệnh sau.

```bash
# Làm theo hướng dẫn ở file data_pipeline/README.md trước

# Sau đó chạy
cd ../data_pipeline
make deploy_feature_repo
cd ../model_serving
```

Sau khi code của Feature Store đã được triển khai sang folder `model_serving`, chúng ta cần cập nhật Feature Registry của Feast, bằng cách chạy các lệnh sau.

```bash
# Trong folder mlops-crash-course-platform, chạy:
bash run.sh feast up

# Trong folder mlops-crash-course-code/model_serving, chạy
cd feature_repo
feast apply
cd ..
```

Sau khi chạy xong, các bạn sẽ thấy file `model_serving/feature_repo/registry/local_registry.db` được sinh ra. Như vậy Feature Store đã được cập nhật ở local.

### Data extraction

Tiếp theo, chúng ta sẽ viết code để đọc data mà chúng ta muốn chạy batch prediction. Code của task này được lưu tại `model_serving/src/data_extraction.py`.

Đầu tiên, để có thể lấy được data từ Feature Store, chúng ta cần khởi tạo kết nối tới Feature Store trước.

```python
# Khởi tạo kết nối tới Feature Store
fs = feast.FeatureStore(repo_path=AppPath.FEATURE_REPO)
```

Tiếp theo, chúng ta cần đọc file data mà chúng ta muốn chạy prediction. File này sẽ nằm tại `model_serving/data/batch_request.csv`. File này chứa field `event_timestamp` và `driver_id` mà sẽ được dùng để match với data trong Feature Store.

```python
# Đọc file data muốn chạy prediction tại batch_input_file
orders = pd.read_csv(batch_input_file, sep="\t")
orders["event_timestamp"] = pd.to_datetime(orders["event_timestamp"])
```

Các feature chúng ta muốn lấy bao gồm `conv_rate`, `acc_rate`, và `avg_daily_trips`. `driver_stats` là tên `FeatureView` mà chúng ta đã định nghĩa tại `data_pipeline/feature_repo/features.py`. Data lấy được sau đó sẽ được xử lý để tương thích với input format mà model yêu cầu.

```python
# Lấy các feature cần thiết từ Feature Store
batch_input_df = fs.get_historical_features(
        entity_df=orders,
        features=[
            "driver_stats:conv_rate",
            "driver_stats:acc_rate",
            "driver_stats:avg_daily_trips",
        ],
    ).to_df()

# Xử lý data cho match với input format của model
batch_input_df = batch_input_df.drop(["event_timestamp", "driver_id"], axis=1)
```

Sau khi đã lấy được data và lưu vào `batch_input_df`, chúng ta sẽ lưu `batch_input_df` vào disk để tiện sử dụng cho task tiếp theo.

```python
# Lưu vào disk
to_parquet(batch_input_df, AppPath.BATCH_INPUT_PQ)
```

Hãy cùng chạy task này ở môi trường phát triển của bạn bằng cách chạy lệnh sau.

```bash
cd src
python data_extraction.py
cd ..
```

Sau khi chạy xong, hãy kiểm tra folder `model_serving/artifacts`, các bạn sẽ nhìn thấy file `batch_input.parquet`.

### Batch prediction

Trước khi chạy batch serving, rõ ràng rằng chúng ta đã quyết định xem sẽ dùng model nào cho batch serving. Thông tin về model mà chúng ta muốn chạy sẽ là một trong những input của batch serving pipeline. Input này có thể là Airflow variable, hoặc đường dẫn tới một file chứa thông tin về model.

Trong phần này, chúng ta sẽ sử dụng model mà chúng ta đã register với MLflow Model Registry ở task **Model validation** trong bài [Xây dựng training pipeline](../../xay-dung-training-pipeline/xay-dung-pipeline/#model-validation). Trong task đó, thông tin về model đã registered được lưu tại `training_pipeline/artifacts/registered_model_version.json`. Chúng ta có thể upload file này vào một Storage nào đó trong tổ chức để các task khác có thể download được model, cụ thể là cho batch serving và online serving ở trong bài này.

Vì chúng ta đang phát triển cả training pipeline và model serving ở local, nên chúng ta chỉ cần copy file `training_pipeline/artifacts/registered_model_version.json` sang `model_serving/artifacts/registered_model_version.json`. Để làm điều này, các bạn hãy chạy lệnh sau.

```bash
cd ../training_pipeline
make deploy_registered_model_file
cd ../model_serving
```

Tiếp theo, chúng ta sẽ viết code cho task batch prediction. Để đơn giản hoá quá trình batch prediction, đoạn code cho task batch prediction này giống như ở task **Model evaluation** mà chúng ta đã viết trong bài [Xây dựng training pipeline](../../xay-dung-training-pipeline/xay-dung-pipeline/#model-evaluation). Code của task này được lưu tại file `model_serving/src/batch_prediction.py`. Mình sẽ tóm tắt lại như sau.

```python
# Lấy thông tin về model từ file registered_model_version.json
# Lưu model path ở MLflow server vào model_uri

# Download model từ MLflow server
mlflow_model = mlflow.pyfunc.load_model(model_uri=model_uri)

# Load data từ file ở task trước
batch_df = load_df(AppPath.BATCH_INPUT_PQ)

# Chạy prediction
preds = mlflow_model.predict(batch_df)
batch_df["pred"] = preds

# Lưu lại kết quả
to_parquet(batch_df, AppPath.BATCH_OUTPUT_PQ)
```

Hãy cùng chạy task này trong môi trường phát triển của bạn bằng cách chạy lệnh sau.

```bash
cd src
python batch_prediction.py
cd ..
```

Sau khi chạy xong, hãy kiểm tra folder `model_serving/artifacts`, các bạn sẽ nhìn thấy file `batch_output.parquet`.

### Airflow DAG

Ở các phần trên, chúng ta đã phát triển xong các đoạn code cần thiết cho batch serving pipeline. Ở phần này, chúng ta sẽ viết Airflow DAG để kết nối các task trên lại thành một pipeline. Đoạn code để định nghĩa Airflow DAG được lưu tại `model_serving/dags/batch_serving_dag.py` và được tóm tắt như dưới đây.

```python
with DAG(
    dag_id="batch_serving_pipeline",
    default_args=DefaultConfig.DEFAULT_DAG_ARGS,
    schedule_interval="@once",
    start_date=pendulum.datetime(2022, 1, 1, tz="UTC"),
    catchup=False,
    tags=["batch_serving_pipeline"],
) as dag:
    # định nghĩa task Cập nhật Feature store
    feature_store_init_task = DockerOperator(
        task_id="feature_store_init_task",
        command="bash -c 'cd feature_repo && feast apply'",
        **DefaultConfig.DEFAULT_DOCKER_OPERATOR_ARGS,
    )

    # định nghĩa task Data extraction
    data_extraction_task = DockerOperator(
        task_id="data_extraction_task",
        command="bash -c 'cd src && python data_extraction.py'",
        **DefaultConfig.DEFAULT_DOCKER_OPERATOR_ARGS,
    )

    # các task khác
```

Chi tiết về những điểm quan trọng cần lưu ý, mời các bạn xem lại bài [Xây dựng training pipeline](../../xay-dung-training-pipeline/xay-dung-pipeline/#airflow-dag).

Tiếp theo, chúng ta sẽ build docker image `mlopsvn/mlops_crash_course/model_serving:latest`. Model này đã được build sẵn và push lên Docker Hub rồi, các bạn không cần build nữa. Tuy nhiên, nếu các bạn muốn sử dụng docker image của riêng mình thì hãy sửa `DOCKER_USER` env var tại file `model_serving/deployment/.env` thành docker user của các bạn và chạy lệnh sau.

```bash
make build_push_image
```

Sau khi đã có docker image, để triển khai DAG đã được định nghĩa ở trên, chúng ta sẽ copy `training_pipeline/dags/*` vào folder `dags` của Airflow, bằng cách chạy các lệnh sau.

```bash
# Trong folder mlops-crash-course-platform, chạy:
bash run.sh airflow up

# Trong folder mlops-crash-course-code/model_serving, chạy
make deploy_dags
```

Tiếp theo, đăng nhập vào Airflow UI trên browser với tài khoản và mật khẩu mặc định là `airflow`. Nếu các bạn đã refresh Airflow UI mà vẫn không thấy training pipeline, thì các bạn có thể vào folder `mlops-crash-course-platform` và chạy lệnh sau để restart Airflow server.

```bash
bash run.sh airflow restart
```

Airflow DAG của chúng ta có sử dụng một Airflow Variable tên là `MLOPS_CRASH_COURSE_CODE_DIR`. Variable này sẽ chứa đường dẫn tuyệt đối tới folder `mlops-crash-course-code/`. Nếu như ở bài [Xây dựng training pipeline](../../xay-dung-training-pipeline/xay-dung-pipeline/#airflow-dag), các bạn đã set variable này rồi thì ở bước này các bạn không cần làm gì nữa. Ngoài ra, nếu các bạn dùng docker image của riêng các bạn thì hãy set Airflow variable `DOCKER_USER` thành tên docker user của các bạn.

Sau đó, hãy mở Airflow server trên browser của bạn, kích hoạt batch serving pipeline và chờ đợi kết quả.

TODO: Chèn ảnh

## Online serving

## Tổng kết
