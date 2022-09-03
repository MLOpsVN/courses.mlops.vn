## Xây dựng POC

Bước tiếp theo, chúng ta sẽ tạo một Jupyter notebook quen thuộc và bắt đầu thử nghiệm xây dựng model. Lưu ý, vì nội dung của khoá học tập trung vào MLOps, quá trình thử nghiệm model sẽ được tối giản hoá.

### Chuẩn bị data

Thông thường ở POC, do data pipeline chưa thể được xây dựng hoàn thiện ngay, nên data dùng để thử nghiệm ở bước POC sẽ được Data Engineer thu thập từ các data source, rồi chuyển giao data thô này cho Data Scientist. Data Scientist sẽ thực hiện các công việc sau:

-   Phân tích data để định nghĩa các transformation rule cho data từ data source. Transformation rule này sẽ được dùng để xây dựng data pipeline
-   Phân tích data, thử nghiệm các feature engineering rule cho data để định nghĩa các feature engineering rule cho data. Feature engineering rule này sẽ được dùng để xây dựng data pipeline
-   Thử nghiệm các model architecture và hyperparameter để định nghĩa các bước trong training pipeline

Trong khoá học này, giả sử rằng Data Engineering đã thu thập data cho chúng ta từ data source và chuyển giao cho chúng ta một file data duy nhất ở dạng `parquet`. Chúng ta sẽ sử dụng file data này để thực hiện công việc của một Data Scientist trong các bước tiếp theo.

### Phân tích data và training code

Trong phần này, chúng ta sẽ sử dụng Jupyter Notebook, một tool quen thuộc với Data Scientist, để viết code phân tích data và training code. Source code được lưu tại [đây](https://github.com/MLOpsVN/mlops-crash-course-code/tree/main/training/nbs).

Đầu tiên, chúng ta sẽ load data và clean data. Ở đây chúng ta có hai file data là `driver_stats.parquet` và `driver_orders.csv`. Hai file này chứa các cột với ý nghĩa tương ứng như sau:

| **File**                 | **Cột**         | **Ý nghĩa**                              |
| ------------------------ | --------------- | ---------------------------------------- |
| **driver_stats.parquet** | driver_id       | ID của driver trong Database của công ty |
|                          | conv_rate       | Một thông số nào đó                      |
|                          | acc_rate        | Một thông số nào đó                      |
|                          | avg_daily_trips | Số cuốc xe trung bình một ngày           |
| **driver_orders.csv**    | driver_id       | ID của driver trong Database của công ty |
|                          | trip_completed  | Cuốc xe có hoàn thành không              |

Code dùng để load và clean data như sau.

```python
DATA_DIR = Path("./data")
TMP_DIR = Path("./tmp")
DATA_PATH = DATA_DIR / "driver_stats.parquet"
LABEL_PATH = DATA_DIR / "driver_orders.csv"
if not DATA_PATH.is_file():
    raise Exception("DATA_PATH not found")
if not LABEL_PATH.is_file():
    raise Exception("LABEL_PATH not found")

# Load data
df_orig = pd.read_parquet(DATA_PATH, engine='fastparquet')
label_orig = pd.read_csv(LABEL_PATH, sep="\t")

# Clean data
label_orig["event_timestamp"] = pd.to_datetime(label_orig["event_timestamp"])

# Định nghĩa tên của cột chứa label
target_col = "trip_completed"
```

Sau khi đã load và clean được data, Data Scientist sẽ phân tích data để hiểu về data. Quá trình này thông thường gồm những công việc sau.

-   Kiểm tra xem có feature nào chứa giá trị `null` không? Nên thay các giá trị `null` bằng giá trị nào?
-   Kiểm tra xem có feature nào có data không đồng nhất không? Ví dụ: khác đơn vị (km/h, m/s), v.v
-   Kiểm tra xem data có các outlier nào không? Nếu có thì có nên xoá bỏ không?
-   Kiểm tra xem có feature nào hay label bị bias không? Nếu có thì là do quá trình sampling bị bias, hay do data bị quá cũ? Nên thử nghiệm các giải pháp để sửa bias thế nào?
-   Kiểm tra xem các feature có bị tương quan với nhau không? Nếu có thì có cần loại bỏ feature nào không hay thử nghiệm các giải pháp thế nào?
-   v.v

Ở mỗi một vấn đề về data ở trên, sẽ tồn tại một hoặc nhiều các giải pháp để giải quyết. Trong đa số các giải pháp, chúng ta sẽ không biết được ngay rằng chúng có hiệu quả hay không. Do đó, quá trình kiểm tra và phân tích data này thường sẽ đi kèm với các thử nghiệm training model. Các metrics trong quá trình đánh giá model sẽ giúp chúng ta đánh giá xem các giải pháp mà chúng ta thực hiện trên data có hiệu quả không. Vì bản chất tự nhiên của Machine Learning là thử nghiệm với data và model, hãy tưởng tượng bước phân tích data này và bước training model như một vòng lặp được thực hiện lặp đi lặp lại nhiều lần.

Trong file notebook `training/nbs/01-poc-training-code.ipynb`, các bạn sẽ thấy rằng data của chúng ta không có feature nào chứa giá trị `null`. Để tập trung vào MLOps, chúng ta sẽ tối giản hoá quá trình phân tích data này và đi thẳng vào viết code để train model. Đoạn code ở dưới được dùng để chia data thành training set và test set, train model, đánh giá model, lưu model, load model lại và thực hiện inference.

```python
# Chọn các feature
selected_ft = ["conv_rate", "acc_rate", "avg_daily_trips"]

# Chia data thành training set và test set
TEST_SIZE = 0.2
train, test = train_test_split(data_df, test_size=TEST_SIZE, random_state=random_seed)
train_x = train.drop([target_col], axis=1)[selected_ft]
test_x = test.drop([target_col], axis=1)[selected_ft]
train_y = train[[target_col]]
test_y = test[[target_col]]

# Train model
ALPHA = 0.5
L1_RATIO = 0.1
model = ElasticNet(alpha=ALPHA, l1_ratio=L1_RATIO, random_state=random_seed)
model.fit(train_x, train_y)

# Đánh giá model
predicted_qualities = model.predict(test_x)
(rmse, mae, r2) = eval_metrics(test_y, predicted_qualities)

# Lưu model
model_path = MODEL_DIR / "driver_model.bin"
joblib.dump(model, model_path)

# Load model
loaded_model = joblib.load(model_path)

# Inference
predictions = loaded_model.predict(test_x)
```

Trong quá trình thử nghiệm data và model, chúng ta sẽ cần thử nghiệm rất nhiều các bộ feature khác nhau, nhiều model architecture khác nhau với các bộ hyperparameter khác nhau. Để có thể reproduce được kết quả training, chúng ta cần phải biết được thử nghiệm nào dùng bộ feature nào, dùng model architecture nào với bộ hyperparameter nào. Trong khoá học này, chúng ta sẽ sử dụng MLOps Platform đã được giới thiệu trong bài trước, và cụ thể là MLflow sẽ đóng vai trò chính giúp chúng ta theo dõi metadata của các lần thử nghiệm.

### Theo dõi các thử nghiệm

MLflow là một open source platform để quản lý vòng đời và các quy trình trong một hệ thống Machine Learning. Một trong những chức năng của MLflow mà chúng ta sẽ sử dụng trong bài này đó là tính năng theo dõi các metadata của các thử nghiệm.

Việc đầu tiên, chúng ta sẽ cho chạy MLflow server trên localhost. Hãy clone [mlops-crash-course-platform github project này](https://github.com/MLOpsVN/mlops-crash-course-platform) về máy của bạn, làm theo hướng dẫn trong README.md, và chạy câu lệnh sau.

```bash
bash run.sh mlflow up
```

Trên browser của bạn, đi tới URL [http://localhost:5000/](http://localhost:5000/) để kiểm tra xem MLflow server đã được khởi tạo thành công chưa.

Tiếp theo, mở file notebook `training/nbs/01-poc-integrate-mlflow.ipynb`, các bạn sẽ thấy chúng ta thêm một đoạn code nhỏ sau để tích hợp MLflow vào đoạn code training của chúng ta.

```python
MLFLOW_TRACKING_URI = "http://localhost:5000"
mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
mlflow.sklearn.autolog()
```

Lưu ý rằng vì chúng ta dùng `sklearn` để train model, dòng code `mlflow.sklearn.autolog()` sẽ giúp chúng ta tự động quá trình log lại các hyperparameter và các metrics trong quá trình training. Nếu bạn sử dụng một training framework khác khi training, rất có khả năng MLflow cũng hỗ trợ quá trình tự động hoá này. Các bạn có thể xem thêm [ở đây](https://mlflow.org/docs/latest/tracking.html#automatic-logging) để biết thêm thông tin về các training framework được MLflow hỗ trợ.

Tiếp theo, thêm đoạn code sau để log lại các hyperparameter và metric tương ứng với một lần thử nghiệm.

```python
# Đặt tên cho lần chạy
mlflow.set_tag("mlflow.runName", uuid.uuid1())

# Log lại feature được dùng
mlflow.log_param("features", selected_ft)

# Log lại các hyperparameter
mlflow.log_param("alpha", ALPHA)
mlflow.log_param("l1_ratio", L1_RATIO)

# Log lại các metric sau khi test trên test set
mlflow.log_metric("testing_rmse", rmse)
mlflow.log_metric("testing_r2", r2)
mlflow.log_metric("testing_mae", mae)

# Log lại model sau khi train
mlflow.sklearn.log_model(model, "model")
```

Bây giờ, hãy mở MLflow trên browser của bạn. Chúng ta sẽ nhìn thấy một giao diện trông như sau.

<img src="../../../assets/images/mlops-crash-course/poc/xay-dung-poc/mlflow-dashboard.png" loading="lazy" />

Như các bạn thấy, mọi thông tin mà chúng ta log lại trong mỗi lần thử nghiệm đã được lưu lại. Các bạn có thể xem thêm thông tin chi tiết về một lần chạy bằng cách ấn vào cột `Start time` của một lần chạy.

### Theo dõi các feature

Trong phần trước, chúng ta đã coi bộ feature chúng ta sử dụng trong quá trình training như một parameter và dùng MLflow để log lại. Tuy nhiên, đây chưa phải giải pháp tối ưu để theo dõi các feature trong quá trình thử nghiệm.

Như các bạn đã biết, mục đích của việc theo dõi các feature này là để chúng ta có thể reproduce lại một lần thử nghiệm. Chỉ bằng việc lưu lại tên của các feature được sử dụng, chúng ta không thể đảm bảo được sẽ reproduce lại được một lần chạy. Bởi vì có thể feature tên như vậy đã bị đổi tên, hoặc tên vẫn giữ nguyên nhưng transformation rule để sinh ra các feature đó đã bị thay đổi. Như vậy, việc theo dõi các feature này không chỉ là theo dõi tên của các feature, mà cả quy trình sinh ra các feature đó.

Ở dự án POC này, vì chúng ta chưa có đủ nguồn lực để xây dựng cơ sở hạ tầng đủ mạnh để hỗ trợ cho việc theo dõi các version của quy trình transform data và tạo ra feature, nên chúng ta chỉ kì vọng sẽ theo dõi được tên các feature từ bộ data thô mà Data Engineer chuyển giao cho chúng ta là đủ rồi. Trong các bài tiếp theo, chúng ta sẽ học cách theo dõi các version của quy trình transform các feature và tích hợp các version đó vào quá trình training.

### Tổng kết

Qua nhiều vòng lặp thử nghiệm data và model trong dự án POC này, chúng ta sẽ định nghĩa ra được vấn đề, giải pháp tiềm năng để xử lý data và train model, và cách đánh giá các giải pháp đó một cách hiệu quả. Các đầu ra này sẽ được dùng để cập nhật lại định nghĩa của vấn đề kinh doanh, định nghĩa các data transformation rule để xây dựng data pipeline, định nghĩa training code để xây dựng training pipeline, và định nghĩa serving code để xây dựng serving pipeline.
