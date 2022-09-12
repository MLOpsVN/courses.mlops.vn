## Mục tiêu

Trong bài này, chúng ta sẽ cùng nhau viết code để triển khai training pipeline với 7 task như hình dưới.

<img src="../../../assets/images/mlops-crash-course/xay-dung-training-pipeline/tong-quan-pipeline/training-pipeline-dag.png" loading="lazy"/>

Chi tiết về mục đích của từng bước, mời các bạn xem lại bài trước [ở đây](../../xay-dung-training-pipeline/tong-quan-pipeline). Source code của bài này đã được tải lên Github repo [mlops-crash-course-code](https://github.com/MLOpsVN/mlops-crash-course-code).

## Xây dựng training pipeline

Trong quá trình chạy code cho tất cả các phần dưới đây, chúng ta giả sử rằng folder gốc nơi chúng ta làm việc là folder `training_pipeline`.

### Cài đặt môi trường phát triển

Để xây dựng pipeline nhanh chóng, chúng ta cần xây dựng môi trường phát triển ở local. Các thư viện các bạn cần cài đặt cho môi trường phát triển được đặt tại `training_pipeline/dev_requirements.txt`. Các bạn có thể dùng `virtualenv`, `conda` hoặc bất kì tool nào để cài đặt môi trường phát triển.

Sau khi cài đặt môi trường phát triển, chúng ta cần làm 2 việc sau.

1. Copy file `training_pipeline/.env-example`, đổi tên thành `training_pipeline/.env`. File này chứa các config cần thiết cho training pipeline. Các bạn có thể sửa nếu cần.

1. Copy file `training_pipeline/deployment/.env-example`, đổi tên thành `training_pipeline/deployment/.env`. File này chứa các config cần thiết cho việc triển khai training pipeline. Các bạn có thể sửa nếu cần.

1. Set env var `TRAINING_PIPELINE_DIR` bằng đường dẫn tuyệt đối tới folder `training_pipeline`. Env var này là để hỗ trợ việc chạy python code trong folder `training_pipeline/src`.

```bash
export TRAINING_PIPELINE_DIR="path/to/mlops-crash-course-code/training_pipeline"
```

### Cập nhật Feature Store

Trước khi cập nhật Feature Store, chúng ta cần đảm bảo rằng code của Feature Store đã được triển khai lên máy của bạn. Trong thực tế, code của Feature Store sẽ được Data Engineer build và release như một library. ML engineer sẽ download về và sử dụng.

Trong khoá học này, chúng ta để code của Feature Store tại `data_pipeline/feature_repo`. Như vậy, để triển khai code này sang training pipeline, chúng ta chỉ cần copy code từ `data_pipeline/feature_repo` sang `training_pipeline/feature_repo`. Để thuận tiện cho khoá học, các bạn chỉ cần chạy các lệnh sau.

```bash
# Làm theo hướng dẫn ở file data_pipeline/README.md trước

# Sau đó chạy
cd ../data_pipeline
make deploy_feature_repo
cd ../training_pipeline
```

Sau khi code của Feature Store đã được triển khai sang folder `training_pipeline`, chúng ta cần cập nhật Feature Registry của Feast, hay chính là local database dưới dạng file, nơi lưu trữ định nghĩa về các feature và metadata của chúng.

Trước khi cập nhật Feature Registry, chúng ta cần chạy Redis database dành riêng cho Feast. Để chạy Redis database này, các bạn clone Github repo [mlops-crash-course-platform](https://github.com/MLOpsVN/mlops-crash-course-platform). Để thuận tiện cho quá trình phát triển, folder `mlops-crash-course-platform` và folder `mlops-crash-course-code` phải được đặt trong cùng một folder. Sau đó, các bạn hãy mở folder `mlops-crash-course-platform` và chạy lệnh sau.

```bash
bash run.sh feast up
```

Sau đó, để cập nhập Feature Registry, trong repo `mlops-crash-course-code`, chúng ta chạy các lệnh sau.

```bash
cd feature_repo
feast apply
cd ..
```

Sau khi chạy xong, các bạn sẽ thấy file `training_pipeline/feature_repo/registry/local_registry.db` được sinh ra. Đây chính là Feature Registry của chúng ta.

### Data extraction

Tiếp theo, chúng ta cần viết code để lấy data phục vụ cho quá trình train model từ Feature Store. Code của task này được lưu tại `training_pipeline/src/data_extraction.py`.

Đầu tiên, để có thể lấy được data từ Feature Store, chúng ta cần khởi tạo kết nối tới Feature Store trước.

```python
# Khởi tạo kết nối tới Feature Store
fs = feast.FeatureStore(repo_path=AppPath.FEATURE_REPO)
```

Tiếp theo, chúng ta cần đọc file data chứa label tên là `driver_orders.csv`. File này chứa field `event_timestamp` và `driver_id` mà sẽ được dùng để match với data trong Feature Store.

```python
# Đọc file data chứa label
orders = pd.read_csv(AppPath.DATA / "driver_orders.csv", sep="\t")
    orders["event_timestamp"] = pd.to_datetime(orders["event_timestamp"])
```

Các feature chúng ta muốn lấy bao gồm `conv_rate`, `acc_rate`, và `avg_daily_trips`. `driver_stats` là tên `FeatureView` mà chúng ta đã định nghĩa tại `data_pipeline/feature_repo/features.py`.

```python
# Lấy các feature cần thiết từ Feature Store
training_df = fs.get_historical_features(
        entity_df=orders,
        features=[
            "driver_stats:conv_rate",
            "driver_stats:acc_rate",
            "driver_stats:avg_daily_trips",
        ],
    ).to_df()
```

Sau khi đã lấy được data và lưu vào `training_df`, chúng ta sẽ lưu `training_df` vào disk để tiện sử dụng trong các task tiếp theo.

```python
# Lưu data lấy được vào disk
to_parquet(training_df, AppPath.TRAINING_PQ)
```

Hãy cùng chạy task này ở môi trường phát triển của bạn bằng cách chạy lệnh sau.

```bash
cd src
python data_extraction.py
cd ..
```

Sau khi chạy xong, hãy kiểm tra folder `training_pipeline/artifacts`, các bạn sẽ nhìn thấy file `training.parquet`.

### Data validation

Ở task Data validation này, dựa trên data đã được lưu vào disk ở task Data extraction, chúng ta sẽ đánh giá xem data chúng ta lấy có thực sự hợp lệ không.

Đầu tiên, chúng ta sẽ kiểm tra xem data có chứa feature không mong muốn nào không.

```python
def check_unexpected_features(df: pd.DataFrame):
    cols = set(df.columns)
    for col in cols:
        if not col in config.feature_dict:
            # Báo lỗi feature 'col' không mong muốn
```

Lưu ý rằng `config.feature_dict` là dictionary với key là tên các feature mong muốn và value là format mong muốn của các feature

Tiếp theo, chúng ta sẽ kiểm tra xem data có chứa các feature mong muốn và ở định dạng mong muốn không.

```python
def check_expected_features(df: pd.DataFrame):
    dtypes = dict(df.dtypes)
    for feature in config.feature_dict:
        if not feature in dtypes:
            # Báo lỗi feature 'feature' không tìm thấy
        else:
            expected_type = config.feature_dict[feature]
            real_type = dtypes[feature]
            if expected_type != real_type:
                # Báo lỗi feature 'feature' có định dạng không mong muốn
```

Để đơn gian hoá code và tập trung vào MLOps, trong khoá học này chúng ta sẽ không kiểm tra các tính chất liên quan tới data distribution. Code của task này được lưu tại file `training_pipeline/src/data_validation.py`. Hãy cùng chạy task này trong môi trường phát triển của bạn bằng cách chạy lệnh sau.

```bash
cd src && python data_validation.py && cd ..
```

### Data preparation

Ở task Data preparation, giả sử rằng chúng ta đã lấy được các feature mong muốn ở định dạng mong muốn, chúng ta không cần phải thực hiện thêm các bước biển đổi data, hoặc sinh ra các feature khác nữa.

Đầu tiên, chúng ta sẽ chia data ra thành training set và test set. Đoạn code dưới đây đã được chúng ta viết trong khi làm dự án POC.

```python
target_col = 'tên cột label'

train, test = train_test_split(
    df, test_size=config.test_size, random_state=config.random_seed
)
target_col = config.target_col
train_x = train.drop([target_col], axis=1)
train_y = train[[target_col]]
test_x = test.drop([target_col], axis=1)
test_y = test[[target_col]]
```

Tiếp theo, chúng ta sẽ lưu lại các bộ dataset đã được định dạng thích hợp để sử dụng cho các task Model training và Model evaluation.

```python
to_parquet(train_x, AppPath.TRAIN_X_PQ)
to_parquet(train_y, AppPath.TRAIN_Y_PQ)
to_parquet(test_x, AppPath.TEST_X_PQ)
to_parquet(test_y, AppPath.TEST_Y_PQ)
```

Code của task này được lưu tại file `training_pipeline/src/data_preparation.py`. Hãy cùng chạy task này trong môi trường phát triển của bạn bằng cách chạy lệnh sau.

```bash
cd src
python data_preparation.py
cd ..
```

Sau khi chạy xong, hãy kiểm tra folder `training_pipeline/artifacts`, các bạn sẽ nhìn thấy các files `training.parquet`, `train_x.parquet`, `test_x.parquet`, `train_y.parquet`, và `test_y.parquet`.

### Model training

Đoạn code cho task Model training này đã được chúng ta viết trong khi thực hiện dự án POC. Mình sẽ tóm tắt các công việc trong đoạn code này như sau.

```python
# Cài đặt MLflow server
mlflow.set_tracking_uri(config.mlflow_tracking_uri)

# Load data
train_x = load_df(AppPath.TRAIN_X_PQ)
train_y = load_df(AppPath.TRAIN_Y_PQ)

# Train model
model = ElasticNet(
    alpha=config.alpha,
    l1_ratio=config.l1_ratio,
    random_state=config.random_seed,
)
model.fit(train_x, train_y)

# Log metadata
mlflow.log_param("alpha", config.alpha)
mlflow.log_param("l1_ratio", config.l1_ratio)
mlflow.sklearn.log_model(
    # model và nơi lưu model
)

# Lưu lại thông tin về lần chạy
run_id = mlflow.last_active_run().info.run_id
run_info = RunInfo(run_id)
run_info.save()
```

Các bạn đã quen thuộc từ bước đầu cho tới bước `Log metadata`. Ở bước cuối, chúng ta cần lưu lại thông tin về lần chạy hiện tại vào disk, để các task tiếp theo biết được model nào vừa được train để có thể download model từ MLflow server và đánh giá model. Lưu ý thêm rằng ở bước Log metadata, chúng ta không cần phải log lại danh sách các feature được sử dụng nữa, vì bộ feature chúng ta sử dụng trong training đã được version trong code ở bước Data extraction, đồng thời DAG của chúng ta đã được version bởi `git`.

Code của task này được lưu tại file `training_pipeline/src/model_training.py`. Trước khi chạy file code này, chúng ta cần chạy MLflow server. Để chạy Mlflow server, các bạn mở folder chứa code của Github repo [mlops-crash-course-platform](https://github.com/MLOpsVN/mlops-crash-course-platform) và chạy lệnh sau.

```bash
bash run.sh mlflow up
```

Bây giờ, hãy cùng chạy task này trong môi trường phát triển của bạn bằng cách chạy lệnh sau.

```bash
cd src
python model_training.py
cd ..
```

Sau khi chạy xong, hãy kiểm tra folder `training_pipeline/artifacts`, các bạn sẽ nhìn thấy file `run_info.json`. Nếu mở MLflow server trên browser ra, các bạn cũng sẽ nhìn thấy một experiment đã được tạo ra.

<img src="../../../assets/images/mlops-crash-course/xay-dung-training-pipeline/xay-dung-pipeline/mlflow-training.png" loading="lazy" />

### Model evaluation

Đoạn code cho task Model evaluation này cũng đã được chúng ta viết ở dự án POC. Mình sẽ tóm tắt lại như sau.

```python
model = mlflow.pyfunc.load_model(
    # nơi lưu model
)

# chạy inference trên test set
test_x = load_df(AppPath.TEST_X_PQ)
test_y = load_df(AppPath.TEST_Y_PQ)
predicted_qualities = model.predict(test_x)
(rmse, mae) = eval_metrics(test_y, predicted_qualities)

# Lưu lại kết quả
eval_result = EvaluationResult(rmse, mae)
eval_result.save()
```

Kết quả của các offline metrics sẽ được lưu vào disk để phục vụ cho task Model validation. Code của task này được lưu tại file `training_pipeline/src/model_evaluation.py`. Hãy cùng chạy task này trong môi trường phát triển của bạn bằng cách chạy lệnh sau.

```bash
cd src
python model_evaluation.py
cd ..
```

Sau khi chạy xong, hãy kiểm tra folder `training_pipeline/artifacts`, các bạn sẽ nhìn thấy file `evaluation.json`.

### Model validation

Trong phần này, chúng ta cần đánh giá xem các offline metrics được tính toán ở task Model evaludation có thoả mãn một threshold đã được định nghĩa sẵn không, hay có thoả mãn một baseline đã được định nghĩa ở bước [Phân tích vấn đề](../../tong-quan-he-thong/phan-tich-van-de) không. Chúng ta cũng có thể cần phải kiểm tra xem model mới train được có tương thích với inference service ở production không.

Để đơn giản hoá, mình sẽ chỉ viết code để so sánh offline metrics với các thresholds đã được định nghĩa sẵn trong file `training_pipeline/.env`.

```python
eval_result = EvaluationResult.load(AppPath.EVALUATION_RESULT)

if eval_result.rmse > config.rmse_threshold:
    # RMSE không thoả mãn threshold

if eval_result.mae > config.mae_threshold:
    # MAE không thoả mãn threshold

# Nếu không thoả mãn thresholds -> exit
# Nếu thoả mãn thresholds, register model
result = mlflow.register_model(
    # thông tin về model
)
# Lưu lại thông tin về model đã được registered
dump_json(result.__dict__, AppPath.REGISTERED_MODEL_VERSION)
```

Như các bạn thấy trong đoạn code trên, nếu như các offline metrics của model thoả mãn các yêu cầu đề ra, chúng ta sẽ tự động register model với Model Registry của MLflow. Thông tin của model được registered và version của nó sẽ được lưu lại vào disk để đối chiếu khi cần. Hãy cùng chạy task này trong môi trường phát triển của bạn bằng cách chạy lệnh sau.

```bash
cd src
python model_validation.py
cd ..
```

Sau khi chạy xong, nếu như model thoả mãn các yêu cầu đề ra, hãy kiểm tra folder `training_pipeline/artifacts`, các bạn sẽ nhìn thấy file `registered_model_version.json`. MLflow server cũng sẽ hiển thị model mà bạn đã registered.

<img src="../../../assets/images/mlops-crash-course/xay-dung-training-pipeline/xay-dung-pipeline/mlflow-register.png" loading="lazy" />

Các bạn có thể click vào model đã được register để xem thêm thông tin nó. Cụ thể như ở hình dưới, chúng ta có thể thấy MLflow đã ghi lại cả định dạng hợp lệ cho input và output của model.

<img src="../../../assets/images/mlops-crash-course/xay-dung-training-pipeline/xay-dung-pipeline/mlflow-model-version.png" loading="lazy" />

### Airflow DAG

Như vậy là chúng ta đã phát triển xong các đoạn code cần thiết cho training pipeline. Ở phần này, chúng ta sẽ viết Airflow DAG để kết nối các task trên lại thành một pipeline hoàn chỉnh. Đoạn code để định nghĩa Airflow DAG được tóm tắt như dưới đây.

```python
with DAG(
    dag_id="training_pipeline",
    schedule_interval="@once",
    # các argument khác
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

Trong đoạn code trên, chúng ta cần lưu ý những điểm sau.

-   `schedule_interval="@once"`: DAG của chúng ta sẽ được trigger một lần khi được kích hoạt, sau đó sẽ cần trigger bằng tay
-   `DockerOperator`: chúng ta sử dụng `DockerOperator` để cách ly các task, cho chúng chạy độc lập trong các docker container khác nhau, vì các task khác nhau sẽ có môi trường để chạy kèm các dependencies khác nhau. Tuy nhiên, để đơn giản hoá, trong khoá học này chúng ta sẽ chỉ dùng một Docker image duy nhất cho tất cả các task
-   `command="bash -c 'cd feature_repo && feast apply'"`: command mà chúng ta sẽ chạy trong mỗi task. Command giống hệt với các command mà chúng ta đã chạy trong quá trình viết code ở trên
-   `DefaultConfig.DEFAULT_DOCKER_OPERATOR_ARGS`: vì chúng ta sử dụng một docker image duy nhất cho tất cả các task, mình sử dụng config chung cho các docker container được tạo ra ở mỗi task. Config chung này được lưu trong biến `DefaultConfig.DEFAULT_DOCKER_OPERATOR_ARGS`. Biến này gồm các config như sau.

```python
DEFAULT_DOCKER_OPERATOR_ARGS = {
    "image": "mlopsvn/mlops_crash_course/training_pipeline:latest",
    "network_mode": "host",
    "mounts": [
        # feature repo
        Mount(
            source=AppPath.FEATURE_REPO.absolute().as_posix(),
            target="/training_pipeline/feature_repo",
            type="bind",
        ),
        # artifacts
        Mount(
            source=AppPath.ARTIFACTS.absolute().as_posix(),
            target="/training_pipeline/artifacts",
            type="bind",
        ),
    ],
    # các config khác
}
```

Các field của biến `DEFAULT_DOCKER_OPERATOR_ARGS` được giải thích như sau.

-   `image`: docker image chúng ta sẽ sử dụng cho task
-   `network_mode`: `network_mode` của docker container cần được set thành `host`, để container đó sử dụng cùng một network với máy local. Các bạn có thể đọc thêm ở [đây](https://docs.docker.com/network/host/). Mục đích là để docker container của chúng ta có thể kết nối tới địa chỉ MLflow server đang chạy ở máy local.
-   `mounts`: có hai folders chúng ta cần mount vào trong docker container của mỗi task. Folder `training_pipeline/feature_repo` và folder `training_pipeline/artifacts`
    -   `training_pipeline/feature_repo`: folder này cần được mount vào để chạy task Cập nhật Feature Store
    -   `training_pipeline/artifacts`: folder này cần được mount vào để làm nơi lưu trữ các file trong quá trình chạy các task trên. Ví dụ: training data, kết quả đánh giá model, v.v.
-   `Mount source`: là folder nằm tại máy local của chúng ta, bắt buộc là đường dẫn tuyệt đối.
-   `Mount target`: là folder nằm trong docker container của mỗi task

Code của DAG được lưu tại `training_pipeline/dags/training_dag.py`.

Tiếp theo, chúng ta cần build docker image `mlopsvn/mlops_crash_course/training_pipeline:latest`. Tuy nhiên, image này đã được build sẵn và push lên Docker Hub rồi, các bạn không cần làm gì thêm nữa. Nếu các bạn muốn sử dụng docker image của riêng mình thì hãy sửa docker image mà các bạn muốn dùng và chạy lệnh sau.

```bash
make build_push_image
```

Sau khi đã có docker image, để triển khai DAG trên, chúng ta sẽ copy file `training_pipeline/dags/training_dag.py` vào folder `dags` của Airflow.

Trước khi copy DAG trên vào folder `dags` của Airflow, chúng ta cần chạy Airflow server. Các bạn vào folder `mlops-crash-course-platform` và chạy lệnh sau.

```bash
bash run.sh airflow up
```

Sau đó, quay lại folder `mlops-crash-course-code` và chạy lệnh sau để copy `training_pipeline/dags/training_dag.py` vào folder `dags` của Airflow server.

```bash
make deploy_dags
```

Tiếp theo, đăng nhập vào Airflow UI trên browser với tài khoảng và mật khẩu mặc định là `airflow`. Nếu các bạn đã refresh Airflow UI mà vẫn không thấy training pipeline, thì các bạn có thể vào folder `mlops-crash-course-platform` và chạy lệnh sau để restart Airflow server.

```bash
bash run.sh airflow down
bash run.sh airflow up
```

Airflow DAG của chúng ta có sử dụng một Airflow Variable tên là `MLOPS_CRASH_COURSE_CODE_DIR`. Variable này sẽ chứa đường dẫn tuyệt đối tới folder `mlops-crash-course-code/`. Chúng ta cần đường dẫn tuyệt đối vì `DockerOperator` yêu cầu `Mount Source` phải là đường dẫn tuyệt đối. Giá trị lấy từ Airflow variable `MLOPS_CRASH_COURSE_CODE_DIR` sẽ được dùng để tạo ra `Mount Source`. Các bạn có thể tham khảo [hướng dẫn này](https://airflow.apache.org/docs/apache-airflow/stable/howto/variable.html) để set Airflow Variable.

Sau đó, hãy mở Airflow server trên browser của bạn, kích hoạt training pipeline và chờ đợi kết quả. Sau khi Airflow DAG hoàn thành, các bạn cũng có thể kiểm tra MLflow server và sẽ thấy metadata của lần chạy experiment mới và model train xong đã được log lại.

<img src="../../../assets/images/mlops-crash-course/xay-dung-training-pipeline/xay-dung-pipeline/training-pipeline-airflow.png" loading="lazy" />

## Tổng kết

Như vậy, chúng ta vừa cùng nhau trải qua quy trình phát triển điển hình cho training pipeline. Lưu ý rằng, vì code của training pipeline sẽ được cập nhật liên tục dựa theo các yêu cầu đến từ Data Scientist, nên chúng ta không hy vọng quá trình phát triển training pipeline sẽ chỉ cần thực hiện một lần rồi xong.

Sau khi tự động hoá được training pipeline, trong bài tiếp theo, chúng ta sẽ cùng nhau xây dựng và tự động hoá model serving pipeline.
