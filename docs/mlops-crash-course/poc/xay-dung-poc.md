<figure>
    <img src="../../../assets/images/mlops-crash-course/poc/xay-dung-poc/planning.jpg" loading="lazy"/>
    <figcaption>Photo by <a href="https://unsplash.com/@markuswinkler?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Markus Winkler</a> on <a href="https://unsplash.com/s/photos/problem?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a></figcaption>
</figure>

## Giới thiệu

Ở bài trước, chúng ta đã định nghĩa thế nào là một dự án POC thành công. Trong bài này, chúng ta sẽ thử nghiệm việc xây dựng model chứng minh rằng giải pháp sử dụng ML là khả thi, bằng cách sử dụng MLOps platform đã được định nghĩa ở bài [MLOps Platform](../../tong-quan-he-thong/mlops-platform.md).

## Môi trường phát triển

Đầu tiên, chúng ta cần xây dựng môi trường phát triển ở local. Các bạn hãy clone github repo [mlops-crash-course-code](https://github.com/MLOpsVN/mlops-crash-course-code/) về máy. Các thư viện các bạn cần cài đặt cho môi trường phát triển được đặt tại `training_pipeline/dev_requirements.txt`. Các bạn có thể dùng `virtualenv`, `conda`, `pipenv`, hoặc bất kì tool nào để cài đặt môi trường phát triển.

Các MLOps tools sẽ được sử dụng trong bài này bao gồm:

1. Jupyter notebook để thử nghiệm data, model
1. MLflow để làm ML Metadata Store

## Thu thập data

Thông thường ở POC, do data pipeline chưa thể được xây dựng hoàn thiện ngay, nên data dùng để thử nghiệm ở bước POC sẽ được Data Engineer thu thập từ các data source, rồi chuyển giao data thô này cho Data Scientist. Data Scientist sẽ thực hiện các công việc sau:

- Phân tích data để định nghĩa các transformation rule cho data từ data source. Transformation rule này sẽ được dùng để xây dựng data pipeline
- Phân tích data, thử nghiệm các feature engineering rule cho data để định nghĩa các feature engineering rule cho data. Feature engineering rule này sẽ được dùng để xây dựng data pipeline
- Thử nghiệm các model architecture và hyperparameter để định nghĩa các bước trong training pipeline

Trong khoá học này, giả sử rằng Data Engineering đã thu thập data cho chúng ta từ data source và chuyển giao cho chúng ta một file data duy nhất ở dạng `parquet`. Chúng ta sẽ sử dụng file data này để thực hiện công việc của một Data Scientist trong các bước tiếp theo.

## Phân tích data

Trong phần này, chúng ta sẽ sử dụng Jupyter Notebook, một tool quen thuộc với Data Scientist, để viết code phân tích data và training code. Source code của các notebook sẽ được đặt tại `training_pipeline/nbs/poc-training-code.ipynb`.

Đầu tiên, chúng ta sẽ load data và clean data. Ở đây chúng ta có hai file data là `training_pipeline/nbs/data/exp_driver_stats.parquet` và `training_pipeline/nbs/data/exp_driver_orders.csv`. File `exp_driver_stats.parquet` chứa data của các tài xế, được ghi lại ở nhiều thời điểm, một tài xế sẽ có nhiều records vì được ghi lại các thời điểm khác nhau. File `exp_driver_orders.csv` chứa thông tin về cuốc xe có hoàn thành hay không của các tài xế, một tài xế sẽ có nhiều records vì nhiều cuốc xe xảy ra ở các thời điểm khác nhau. Hai file này chứa các cột với ý nghĩa tương ứng như sau:

| **File**                     | **Cột**         | **Ý nghĩa**                              |
| ---------------------------- | --------------- | ---------------------------------------- |
| **exp_driver_stats.parquet** | datetime        | Thời gian mà record được ghi lại         |
|                              | driver_id       | ID của driver trong Database của công ty |
|                              | conv_rate       | Một thông số nào đó                      |
|                              | acc_rate        | Một thông số nào đó                      |
|                              | avg_daily_trips | Một thông số nào đó                      |
| **exp_driver_orders.csv**    | event_timestamp | Thời gian mà record được ghi lại         |
|                              | driver_id       | ID của driver trong Database của công ty |
|                              | trip_completed  | Cuốc xe có hoàn thành không              |

Code dùng để load và clean data như sau.

```python linenums="1" title="training_pipeline/nbs/poc-training-code.ipynb"
DATA_DIR = Path("./data") # (1)
DATA_PATH = DATA_DIR / "exp_driver_stats.parquet"
LABEL_PATH = DATA_DIR / "exp_driver_orders.csv"

df_orig = pd.read_parquet(DATA_PATH, engine='fastparquet') # (2)
label_orig = pd.read_csv(LABEL_PATH, sep="\t")

label_orig["event_timestamp"] = pd.to_datetime(label_orig["event_timestamp"]) # (3)

target_col = "trip_completed" # (4)
```

1. Định nghĩa path tới data files
2. Load data
3. Clean data
4. Định nghĩa tên của cột chứa label

Sau khi đã load và clean được data, Data Scientist sẽ phân tích data để hiểu về data. Quá trình này thông thường gồm những công việc sau.

- Kiểm tra xem có feature nào chứa giá trị `null` không? Nên thay các giá trị `null` bằng giá trị nào?
- Kiểm tra xem có feature nào có data không đồng nhất không? Ví dụ: khác đơn vị (km/h, m/s), v.v
- Kiểm tra xem data có các outlier nào không? Nếu có thì có nên xoá bỏ không?
- Kiểm tra xem có feature nào hay label bị bias không? Nếu có thì là do quá trình sampling bị bias, hay do data bị quá cũ? Nên thử nghiệm các giải pháp để sửa bias thế nào?
- Kiểm tra xem các feature có bị tương quan với nhau không? Nếu có thì có cần loại bỏ feature nào không hay thử nghiệm các giải pháp thế nào?
- v.v

Ở mỗi một vấn đề về data ở trên, sẽ tồn tại một hoặc nhiều các giải pháp để giải quyết. Trong đa số các giải pháp, chúng ta sẽ không biết được ngay rằng chúng có hiệu quả hay không. Do đó, quá trình kiểm tra và phân tích data này thường sẽ đi kèm với các thử nghiệm training model. Các metrics trong quá trình đánh giá model sẽ giúp chúng ta đánh giá xem các giải pháp mà chúng ta thực hiện trên data có hiệu quả không. Vì bản chất tự nhiên của Machine Learning là thử nghiệm với data và model, hãy tưởng tượng bước phân tích data này và bước training model như một vòng lặp được thực hiện lặp đi lặp lại nhiều lần.

May mắn rằng các file data của chúng ta không có feature nào chứa giá trị `null`. Tiếp theo, để tập trung vào MLOps, chúng ta sẽ tối giản hoá quá trình phân tích data này và đi thẳng vào viết code để train model.

## Chuẩn bị data

<figure>
    <img src="../../../assets/images/mlops-crash-course/poc/xay-dung-poc/data-analysis.jpg" loading="lazy"/>
    <figcaption>Photo by <a href="https://unsplash.com/@lukechesser?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Luke Chesser</a> on <a href="https://unsplash.com/s/photos/analysis?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a></figcaption>
</figure>

Đầu tiên, chúng ta sẽ cần tổng hợp features từ DataFrame `df_orig` với labels từ DataFrame `label_orig`. Cụ thể, với mỗi record trong `label_orig`, chúng ta muốn lấy ra _record mới nhất tương ứng_ trong `df_orig` mà có `driver_id` giống nhau. _Record mới nhất tương ứng_ ở đây có nghĩa là thời gian ở cột `datetime` trong `df_orig` sẽ xảy ra trước và gần nhất với thời gian ở cột `event_timestamp` trong `label_orig`. Ví dụ:

- `df_orig` chứa 2 records như sau

| index | datetime   | driver_id | conv_rate | acc_rate | avg_daily_trips |
| ----- | ---------- | --------- | --------- | -------- | --------------- |
| 1     | 2022-12-01 | 1001      | 0.1       | 0.1      | 100             |
| 2     | 2022-11-01 | 1001      | 0.2       | 0.2      | 200             |
| 3     | 2022-10-01 | 1001      | 0.3       | 0.3      | 300             |
| 4     | 2022-09-01 | 1001      | 0.4       | 0.4      | 400             |

- `label_orig` chứa 2 records như sau

| index | event_timestamp | driver_id | trip_completed |
| ----- | --------------- | --------- | -------------- |
| 1     | 2022-12-15      | 1001      | 1              |
| 2     | 2022-09-15      | 1001      | 0              |

- Data mà chúng ta muốn tổng hợp gồm 2 records như sau

| index | event_timestamp | driver_id | trip_completed | conv_rate | acc_rate | avg_daily_trips |
| ----- | --------------- | --------- | -------------- | --------- | -------- | --------------- |
| 1     | 2022-12-15      | 1001      | 1              | 0.1       | 0.1      | 100             |
| 2     | 2022-09-15      | 1001      | 0              | 0.4       | 0.4      | 400             |

- Giải thích

      - Features từ index 1 ở `df_orig` được lấy ra cho record index 1 ở `label_orig`, vì feature đó là mới nhất so với `event_timestamp` của record ở index 1 trong `label_orig`
      - Tương tự, features từ index 4 ở `df_orig` được lấy ra cho record index 1 ở `label_orig`, vì feature đó là mới nhất và xảy ra trước so với `event_timestamp` của record ở index 1 trong `label_orig`

Code để tổng hợp features và labels như dưới đây.

```python linenums="1" title="training_pipeline/nbs/poc-training-code.ipynb"
groups = df_orig.groupby('driver_id') # (1)

def proc_row(row): # (2)
    global data_df
    end_time = row['event_timestamp']
    driver_id = row['driver_id']

    grp_rows = groups.get_group(driver_id) # (3)
    grp_rows = grp_rows[grp_rows['datetime'] <= end_time] # (4)
    grp_rows = grp_rows.sort_values('datetime') # (5)
    grp_rows = grp_rows.iloc[-1] # (6)

    grp_rows['event_timestamp'] = end_time # (7)
    grp_rows['trip_completed'] = row['trip_completed']

    return grp_rows.squeeze(axis=0) # (8)

data_df = label_orig.apply(proc_row, axis=1)

data_df = data_df[data_df.columns. \ # (9)
    drop("datetime"). \
    drop("driver_id"). \
    drop("created"). \
    drop("event_timestamp")]
```

1. Nhóm features lại vào các nhóm theo `driver_id`
2. Function để xử lý mỗi hàng trong `label_orig`
3. Lấy ra các hàng trong `df_orig` của một tài xế
4. Lấy ra các hàng trong `df_orig` có `datetime` <= `event_timestamp` của hàng hiện tại trong `label_orig`
5. Sắp xếp các hàng theo cột `datetime`
6. Lấy ra hàng ở thời gian gần nhất
7. Thêm các cột cần thiết vào
8. Biến thành Series (một hàng)
9. Loại bỏ các cột không cần thiết

## Viết training code

Sau khi tổng hợp được features và labels vào `data_df`, chúng ta sẽ chia DataFrame này thành training set và test set, rồi thực hiện một loạt các thao tác rất quen thuộc bao gồm train model, và đánh giá model như đoạn code dưới đây.

```python linenums="1" title="training_pipeline/nbs/poc-training-code.ipynb"
selected_ft = ["conv_rate", "acc_rate", "avg_daily_trips"] # (1)
TARGET_COL = "trip_completed"
TEST_SIZE = 0.2

train, test = train_test_split(data_df, test_size=TEST_SIZE, random_state=random_seed) # (2)
train_x = train.drop([TARGET_COL], axis=1)[selected_ft]
test_x = test.drop([TARGET_COL], axis=1)[selected_ft]
train_y = train[[TARGET_COL]]
test_y = test[[TARGET_COL]]

ALPHA = 0.5
L1_RATIO = 0.1
model = ElasticNet(alpha=ALPHA, l1_ratio=L1_RATIO, random_state=random_seed) # (3)
model.fit(train_x, train_y)

predicted_qualities = model.predict(test_x) # (4)
(rmse, mae, r2) = eval_metrics(test_y, predicted_qualities)
```

1. Chọn các features để train
2. Chia data thành training set và test set
3. Train model
4. Đánh giá model

Trong quá trình thử nghiệm data và model, chúng ta sẽ cần thử nghiệm rất nhiều các bộ feature khác nhau, nhiều model architecture khác nhau với các bộ hyperparameter khác nhau. Để có thể reproduce được kết quả training, chúng ta cần phải biết được thử nghiệm nào dùng bộ feature nào, dùng model architecture nào với bộ hyperparameter nào. Trong khoá học này, chúng ta sẽ sử dụng MLOps Platform đã được giới thiệu trong bài [MLOps Platform](../../tong-quan-he-thong/mlops-platform.md), và cụ thể là MLflow sẽ đóng vai trò chính giúp chúng ta theo dõi metadata của các lần thử nghiệm.

## Theo dõi các thử nghiệm

[MLflow](https://mlflow.org/) là một open source platform để quản lý vòng đời và các quy trình trong một hệ thống Machine Learning. Một trong những chức năng của MLflow mà chúng ta sẽ sử dụng trong bài này đó là tính năng theo dõi các metadata của các thử nghiệm.

Việc đầu tiên, chúng ta sẽ cho chạy MLflow server trên môi trường local. Hãy clone github repo [mlops-crash-course-platform](https://github.com/MLOpsVN/mlops-crash-course-platform) về máy của bạn, và chạy câu lệnh sau.

```bash
bash run.sh mlflow up
```

Trên browser của bạn, đi tới URL [http://localhost:5000/](http://localhost:5000/) để kiểm tra xem MLflow server đã được khởi tạo thành công chưa.

Tiếp theo, mở file notebook `training_pipeline/nbs/poc-integrate-mlflow.ipynb`, các bạn sẽ thấy chúng ta thêm một đoạn code nhỏ sau để tích hợp MLflow vào đoạn code training của chúng ta.

```python linenums="1" title="training_pipeline/nbs/poc-integrate-mlflow.ipynb"
MLFLOW_TRACKING_URI = "http://localhost:5000"
mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
mlflow.sklearn.autolog() # (1)
```

1. Vì chúng ta dùng `sklearn` để train model, dòng này giúp tự động quá trình log lại các hyperparameter và các metrics trong quá trình training. Nếu bạn sử dụng một training framework khác khi training, rất có khả năng MLflow cũng hỗ trợ quá trình tự động hoá này. Các bạn có thể xem thêm [ở đây](https://mlflow.org/docs/latest/tracking.html#automatic-logging) để biết thêm thông tin về các training framework được MLflow hỗ trợ.

Tiếp theo, thêm đoạn code sau để log lại các hyperparameter và metric tương ứng với một lần thử nghiệm.

```python linenums="1" title="training_pipeline/nbs/poc-integrate-mlflow.ipynb"
mlflow.set_tag("mlflow.runName", uuid.uuid1()) # (1)

mlflow.log_param("features", selected_ft) # (2)

mlflow.log_param("alpha", ALPHA) # (3)
mlflow.log_param("l1_ratio", L1_RATIO)

mlflow.log_metric("testing_rmse", rmse) # (4)
mlflow.log_metric("testing_r2", r2)
mlflow.log_metric("testing_mae", mae)

mlflow.sklearn.log_model(model, "model") # (5)
```

1. Đặt tên cho lần chạy
2. Log lại feature được dùng
3. Log lại các hyperparameter
4. Log lại các metric sau khi test trên test set
5. Log lại model sau khi train

Bây giờ, hãy mở MLflow trên browser của bạn. Chúng ta sẽ nhìn thấy một giao diện trông như sau.

<img src="../../../assets/images/mlops-crash-course/poc/xay-dung-poc/mlflow-dashboard.png" loading="lazy" />

Như các bạn thấy, mọi thông tin mà chúng ta log lại trong mỗi lần thử nghiệm đã được lưu lại. Các bạn có thể xem thêm thông tin chi tiết về một lần chạy bằng cách ấn vào cột `Start time` của một lần chạy.

## Theo dõi các feature

Trong phần trước, chúng ta đã coi bộ feature chúng ta sử dụng trong quá trình training như một parameter và dùng MLflow để log lại. Tuy nhiên, đây chưa phải giải pháp tối ưu để theo dõi các feature trong quá trình thử nghiệm.

Như các bạn đã biết, mục đích của việc theo dõi các feature này là để chúng ta có thể reproduce lại một lần thử nghiệm. Chỉ bằng việc lưu lại tên của các feature được sử dụng, chúng ta không thể đảm bảo được sẽ reproduce lại được một lần chạy. Bởi vì có thể feature tên như vậy đã bị đổi tên, hoặc tên vẫn giữ nguyên nhưng transformation rule để sinh ra các feature đó đã bị thay đổi. Như vậy, việc theo dõi các feature này không chỉ là theo dõi tên của các feature, mà cả quy trình sinh ra các feature đó.

Ở giai đoạn POC này, vì chúng ta chưa có đủ nguồn lực để xây dựng cơ sở hạ tầng đủ mạnh để hỗ trợ cho việc theo dõi các version của quy trình transform data và tạo ra feature, nên chúng ta chỉ kì vọng sẽ theo dõi được tên các feature từ bộ data thô mà Data Engineer chuyển giao cho chúng ta là đủ rồi. Trong các bài tiếp theo, chúng ta sẽ học cách theo dõi các version của quy trình transform các feature và tích hợp các version đó vào quá trình training.

## Tổng kết

Như vậy là chúng ta đã thực hiện xong dự án POC. Qua nhiều vòng lặp thử nghiệm data và model trong dự án POC, ngoài việc chứng minh rằng giải pháp ML là khả thi, chúng ta sẽ hiểu rõ ràng hơn về vấn đề kinh doanh, về giải pháp tiềm năng để xử lý data và train model, và về cách đánh giá các giải pháp đó một cách hiệu quả. Các đầu ra này sẽ được dùng để cập nhật lại định nghĩa của vấn đề kinh doanh, định nghĩa các data transformation rule để xây dựng data pipeline, định nghĩa training code để xây dựng training pipeline, và định nghĩa serving code để xây dựng model serving. Trong bài tiếp theo, chúng ta sẽ đi xây dựng data pipeline, một trong những pipeline phức tạp nhất của hệ thống.
