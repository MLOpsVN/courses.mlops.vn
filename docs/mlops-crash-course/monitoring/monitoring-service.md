## Giới thiệu

Trong bài trước, chúng ta đã triển khai ELK Stack để thu thập, theo dõi logs từ các services; và Prometheus server, Grafana server để theo dõi các metrics hệ thống của các services như là CPU, memory, network, v.v. Ngoài các metrics đó ra, trong một hệ thống ML, chúng ta cũng cần theo dõi các metrics liên quan tới data và model, để kịp thời phát hiện sự thay đổi của data và model performance ở production, để có thể cập nhật data hay train lại model kịp thời. Trong bài này, chúng ta sẽ thực hiện các công việc sau:

1. Sinh ra dataset chứa feature bị drift
1. Triển khai _monitoring service_ để theo dõi data và model performance
1. Triển khai các Grafana dashboards để hiển thị các metrics về data và model

## Môi trường phát triển

Các library bạn cần cài đặt cho môi trường phát triển được đặt tại `monitoring_service/dev_requirements.txt`. Sau khi cài đặt môi trường phát triển, bạn cần làm tiếp các việc sau.

1. Copy file `monitoring_service/deployment/.env-example`, đổi tên thành `monitoring_service/deployment/.env`. File này chứa các config cần thiết cho việc triển khai việc triển khai model serving.

1. Set env var `MONITORING_SERVICE_DIR` bằng đường dẫn tuyệt đối tới folder `monitoring_service`. Env var này là để hỗ trợ việc chạy python code trong folder `monitoring_service/src` trong quá trình phát triển.

```bash
export MONITORING_SERVICE_DIR="path/to/mlops-crash-course-code/monitoring_service"
```

Các tools sẽ được sử dụng trong bài này bao gồm:

1. Feast để truy xuất Feature Store
1. Flask để viết API cho monitoring service
1. Evidently để kiểm tra chất lượng data và model performance

!!! note

    Trong quá trình chạy code cho tất cả các phần dưới đây, giả sử rằng folder gốc nơi chúng ta làm việc là folder `monitoring_service`.

## Architecture

Theo dõi các metrics liên quan tới chất lượng data và model performance là quá trình kiểm tra xem data và model performance thay đổi như thế nào theo thời gian. Đây cũng chính là yêu cầu đầu ra của monitoring service.

Thông thường, để biết được data thay đổi như thế nào, chúng ta sẽ so sánh data ở production với data mà chúng ta sử dụng để train model dựa trên một thuật toán so sánh nào đó, cho phép chúng ta biết được data có bị drift hay không, hay nói cách khác, xem các thuộc tính về thống kê của data bị thay đổi nhiều hay ít như thế nào.

Để biết được model performance thay đổi thế nào, chúng ta sẽ thu thập label ở production, so sánh với prediction mà model sinh ra, và theo dõi model performance metrics theo thời gian. Model performance ở production cũng sẽ được so sánh với model performance ở bước training. Như vậy, đầu vào của monitoring service là data ở bước train model, và label ở production.

Dựa vào các phân tích về đầu vào, đầu ra như trên, chúng ta có architecture của monitoring service như sau.

TODO: Vẽ hình

Monitoring service có 3 chức năng chính:

1.  Phát hiện data drift

    - Input: training data, data ở production
    - Output: Các metrics về chất lượng data

2.  Theo dõi model performance

    - Input: training labels, labels của requests ở production
    - Output: Model performance metrics

Trong bài này, chúng ta sẽ sử dụng thư viện Evidently để phát hiện data drift và model performance. Evidently là một thư viện open-source được sử dụng để đánh giá, kiểm tra, và giám sát data và model performance. Evidently đã tích hợp sẵn các thuật toán để theo dõi các thuộc tính thống kê của data như **PSI**, **K-L divergence**, **Jensen-Shannon distance**, **Wasserstein distance**, và các metrics phổ biến của model performance như **Accuracy**, **F1 score**, **RMSE**, **MAE**, v.v. Các bạn có thể đọc thêm ở [document của Evidently](https://docs.evidentlyai.com/reference/data-drift-algorithm) để tìm hiểu về cách mà Evidently lựa chọn thuật toán tự động để phát hiện data drift tuỳ thuộc vào kích thước của dataset.

## Cách test monitoring service

> Before you start anything, learn how to finish it.

Trong phần này, trước khi bắt tay vào code, chúng ta sẽ cùng phân tích xem làm thế nào để test 2 chức năng kể trên của monitoring service.

### Cách test phát hiện data drift

Để test chức năng phát hiện data drift của monitoring service, chúng ta cần sắp đặt 2 tình huống:

1. Data ở production không bị drift
1. Data ở production bị drift

Chúng ta có 1 lựa chọn hiển nhiên nhất cho 2 tình huống này như sau:

1.  Data ở production không bị drift

    - Sinh ra dataset 1 làm data ở production có phân phối giống training data, lưu nó vào Feature Store
    - Gửi request chứa driver ids tới Online serving API
    - Data được lấy ra từ Feature Store để dự đoán sẽ có phân phối giống training data, tức là sẽ không xảy ra data drift giữa training data và data ở production

1.  Data ở production bị drift

    - Sinh ra dataset 2 làm data ở production có phân phối khác training data, lưu nó vào Feature Store
    - Gửi request chứa driver ids tới Online serving API
    - Data được lấy ra từ Feature Store để dự đoán sẽ có phân phối khác training data, tức là sẽ xảy ra data drift giữa training data và data ở production

Tuy nhiên, cách sắp đặt như trên khiến chúng ta cần kiểm tra phân phối của training data. Việc này là không cần thiết, khi mà phân phối của training data có thể là bất kì phân phối nào, trong khi chúng ta chỉ cần kiểm tra xem monitoring service có hoạt động đúng chức năng không. Do đó, chúng ta có một cách sắp đặt đơn giản hơn như sau.

1.  Data ở production không bị drift

    - Sinh ra dataset 1, gọi là `normal_data`, có giá trị nằm trong khoảng [A, B]. Giả sử `normal_data` vừa là training data, vừa là data ở production, và được lưu vào Feature Store
    - Data được lấy ra ở Feature Store để dự đoán chính là training data, tức là sẽ không xảy ra data drift giữa training data và data ở production

2.  Data ở production bị drift

    - Sinh ra dataset 2, gọi là `drift_data`, có giá trị nằm trong khoảng [C, D] với C và D nằm đủ xa A và B. Giả sử `normal_data` là training data, còn `drift_data` là data ở production. `drift_data` được lưu vào Feature Store
    - Data được lấy ra ở Feature Store (`drift_data`) để dự đoán có giá trị nằm xa training data (`normal_data`), tức là sẽ xảy ra data drift giữa training data và data ở production

!!! question

    Để phát hiện data drift, chúng ta sẽ so sánh training data với data ở production. Vậy chúng ta cần lấy ra bao nhiêu records trong training data và tích luỹ bao nhiêu records của data ở production thì mới bắt đầu thực hiện quá trình so sánh?

Khi training dataset quá lớn, chúng ta không thể lấy hết các records ra để so sánh được (nếu thuật toán so sánh không cho phép tính toán các metrics để so sánh trước). Thông thường, chúng ta sẽ cố gắng dùng một con số đủ nhỏ để việc theo dõi data được diễn ra liên tục và gần với thời gian thực nhất (near real-time), để phát hiện kịp thời các vấn đề về data. Đồng thời, con số này cũng phải đủ lớn, để các tính chất thống kê của data không bị quá khác biệt ở các phần của dataset. Phương pháp lựa chọn và con số cần lựa chọn cho số các records tuỳ thuộc vào nhu cầu và tần suất theo dõi data ở production của mỗi dự án.

Để đơn giản, chúng ta sẽ sinh ra 5 records cho mỗi dataset, và chỉ tích luỹ 5 records của data ở production để thực hiện việc so sánh data.

Một lý do nữa cho con số 5 là vì ở Online serving API, features được lấy ra sẽ là features mới nhất trong dataset. Do đó, việc sinh ra nhiều records ở nhiều thời điểm là không cần thiết, chỉ cần đảm bảo rằng tồn tại ít nhất 1 record trong Feature Store cho mỗi driver id ở request gửi đến là đủ. Và vì dataset gốc chỉ chứa 5 driver ids bao gồm `[1001, 1002, 1003, 1004, 1005]`, nên chúng ta chỉ cần 5 records cho mỗi dataset.

Tóm lại, chúng ta cần sinh ra 2 datasets có khoảng giá trị nằm xa nhau, mỗi dataset có 5 records tương ứng với 5 driver ids. Để đơn giản hoá quá trình test, phân phối chuẩn sẽ được sử dụng cho các giá trị của features.

Bảng dưới đây là một ví dụ của `normal_data`.

| index | datetime                  | driver_id | conv_rate | acc_rate | avg_daily_trips |
| ----- | ------------------------- | --------- | --------- | -------- | --------------- |
| 0     | 2021-07-19 23:00:00+00:00 | 1001      | 0.186341  | 0.226879 | 107             |
| 1     | 2021-07-18 06:00:00+00:00 | 1002      | 0.071032  | 0.229490 | 250             |
| 2     | 2021-07-28 09:00:00+00:00 | 1003      | 0.050000  | 0.192864 | 103             |
| 3     | 2021-07-27 10:00:00+00:00 | 1004      | 0.184332  | 0.050000 | 49              |
| 4     | 2021-07-23 05:00:00+00:00 | 1005      | 0.250000  | 0.250000 | 246             |

Bảng dưới đây là một ví dụ của `drift_data`.

| index | datetime                  | driver_id | conv_rate | acc_rate | avg_daily_trips |
| ----- | ------------------------- | --------- | --------- | -------- | --------------- |
| 0     | 2021-07-19 23:00:00+00:00 | 1001      | 0.886341  | 0.926879 | 807             |
| 1     | 2021-07-18 06:00:00+00:00 | 1002      | 0.771032  | 0.929490 | 950             |
| 2     | 2021-07-28 09:00:00+00:00 | 1003      | 0.750000  | 0.892864 | 803             |
| 3     | 2021-07-27 10:00:00+00:00 | 1004      | 0.884332  | 0.750000 | 750             |
| 4     | 2021-07-23 05:00:00+00:00 | 1005      | 0.950000  | 0.950000 | 946             |

### Cách test theo dõi model performance

Để test chức năng theo dõi model performance của monitoring service, chúng ta cần có label của mỗi request được gửi tới Online serving API, thì mới biết được prediction tạo bởi model là đúng hay sai.

Như chúng ta đã biết ở [phần Online serving của bài Triển khai model serving](../../trien-khai-model-serving/trien-khai-model-serving/#online-serving), request được gửi tới Online serving API có dạng như sau.

```json
{
  "request_id": "uuid-1",
  "driver_ids": [1001, 1002, 1003, 1004, 1005]
}
```

Và response trả về có dạng như sau.

```json
{
  "prediction": 1001,
  "error": null
}
```

Mặc dù với mỗi driver id, model sẽ trả về 1 số thực thể hiện khả năng mà tài xế có hoàn thành hay không. Tuy nhiên, ở production, chúng ta không có label để biết chính xác số thực này hay khả năng này là bao nhiêu. Chúng ta chỉ biết rằng, với driver id là `1001` trả về bởi model, tài xế có id `1001` có hoàn thành cuốc xe hay không. Bảng dưới đây giả sử request và label của request.

| request_id | Tài xế được chọn | Hoàn thành |
| ---------- | ---------------- | ---------- |
| uuid-1     | 1001             | 1          |
| uuid-2     | 1001             | 0          |
| uuid-3     | 1002             | 1          |

Như các bạn thấy, response của mỗi request là tài xế được chọn, tức là prediction luôn là `1` cho tài xế được chọn. Cột `Hoàn thành` chính là label cho mỗi request. Như vậy, để test chức năng theo dõi model performance của monitoring service, chúng ta chỉ cần sinh ra labels cho mỗi request được gửi tới.

!!! question

    Cần sinh ra bao nhiêu request và label tương ứng?

Ở phần trước, chúng ta đã phân tích rằng chỉ cần tích luỹ 5 records là đủ để thực hiện quá trình so sánh data, nên số lượng request và label tương ứng chúng ta cần sinh ra 5 records. Dataset chứa 5 records này được gọi là `request_data`, gồm 3 cột:

1. `request_id`: request id
1. `driver_ids`: danh sách các driver id được gửi đến trong request
1. `trip_completed`: label cho request

Giả sử tài xế `1001` luôn được dự đoán là tài xế có khả năng cao nhất sẽ hoàn thành cuốc xe, thì bộ features của tài xế `1001` sẽ luôn được gửi về monitoring service, khiến cho chúng ta không thể kiểm soát được phân phối của data ở production trong quá trình test monitoring service. Do đó, chúng ta cần đảm bảo cả 5 bộ features của 5 tài xế trong dataset mà chúng ta dùng (`normal_data` hoặc `drift_data`) đều được gửi tới Online serving API lần lượt. Điều này giúp cho phân phối của data trong 5 requests này giống với phân phối của cả dataset mà chúng ta dùng, giúp chúng ta kiểm soát được 2 trường hợp data không bị drift và bị drift. Bảng dưới đây là một ví dụ cho dataset `request_data`.

| request_id | driver_ids | trip_completed |
| ---------- | ---------- | -------------- |
| uuid-1     | [1001]     | 1              |
| uuid-2     | [1002]     | 0              |
| uuid-3     | [1003]     | 1              |
| uuid-4     | [1004]     | 0              |
| uuid-5     | [1005]     | 1              |

Như vậy là chúng ta đã phân tích xong cách test monitoring service, với các bộ dataset cần được tạo ra bao gồm `normal_data`, `drift_data`, và `request_data`. Trong các phần dưới đây, chúng ta sẽ thực hiện viết code.

## Tạo datasets

Trong phần này, chúng ta sẽ sinh ra 2 datasets có tính chất và mục đích như bảng dưới đây.

| Tên dataset   | Phân phối                                   | Mục đích                                                  | Số records |
| ------------- | ------------------------------------------- | --------------------------------------------------------- | ---------- |
| `normal_data` | Phân phối chuẩn, giá trị thuộc [0.05, 0.25] | Giả làm training data và data không bị drift ở production | 5          |
| `drift_data`  | Phân phối chuẩn, giá trị thuộc [0.75, 0.95] | Giả làm data bị drift ở production                        | 5          |

Notebook `monitoring_service/nbs/prepare_datasets.ipynb` đã chứa code để sinh ra 2 datasets này. Mình sẽ tóm tắt chức năng của các đoạn code như sau.

Đầu tiên, chúng ta sẽ lấy ra danh sách các driver id từ dataset gốc, và tạo một dataset cho bài toán classification dựa vào hàm `make_classification` có sẵn của scikit-learn, đồng thời biến đổi giá trị của features về đoạn mong muốn.

```python linenums="1" title="monitoring_service/nbs/prepare_datasets.ipynb"
df_orig = pd.read_parquet(DATA_PATH, engine='fastparquet')
driver_ids = np.unique(df_orig['driver_id']) # (1)

N_SAMPLES = driver_ids.shape[0]
X, _ = make_classification(n_samples=N_SAMPLES, random_state=random_seed) # (2)

scaler = MinMaxScaler(feature_range=(0.05, 0.25))
X = scaler.fit_transform(X) # (3)

scaler = MinMaxScaler(feature_range=(0.75, 0.95))
X_shift = scaler.fit_transform(X) # (4)
```

1. Lấy ra các driver ids từ dataset gốc
2. Tạo ra 1 dataset theo phân phối chuẩn
3. Biến đổi `X` về đoạn [0.05, 0.25]. `X` sẽ được dùng để tạo `normal_data`
4. Biến đổi `X` về đoạn [0.75, 0.95], lưu vào `X_shift`. `X_shift` sẽ được dùng để tạo `drift_data`

Tiếp theo, chúng ta sẽ sử dụng 3 cột đầu tiên của `X` và `X_shift` để làm features cho `normal_data` và `drift_data`. Đoạn code dưới đây sẽ tạo ra 2 datasets này.

```python linenums="1" title="monitoring_service/nbs/prepare_datasets.ipynb"
def create_dataset(generated_X):
    df = pd.DataFrame()
    df['conv_rate'] = generated_X[:, 0]
    df['acc_rate'] = generated_X[:, 1]
    df['avg_daily_trips'] = np.array((generated_X[:, 2] * 1000), dtype=int) # (1)
    return df

normal_df = create_dataset(X)
drift_df = create_dataset(X)
```

1. Để ý rằng feature `avg_daily_trips` nằm trong khoảng từ 0 tới 1000

Như vậy là chúng ta vừa tạo ra dataset `normal_data` và `drift_data`. Bây giờ, chúng ta sẽ tạo ra `request_data` như đã phân tích ở phần trước.

```python linenums="1" title="monitoring_service/nbs/prepare_datasets.ipynb"
request_id_list = [] # (1)
driver_ids_list = [] # (2)

for i in range(N_SAMPLES):
    request_id = f"uuid-{i}"
    request_id_list.append(request_id)
    driver_id = driver_ids[i % len(driver_ids)] # (3)
    driver_ids_list.append([driver_id])

y = np.random.choice([0, 1], size=N_SAMPLES, p=[0.3, 0.7]) # (4)

request_df = pd.DataFrame() # (5)
request_df['request_id'] = request_id_list
request_df['driver_ids'] = driver_ids_list
request_df['trip_completed'] = y
```

1. Khởi tạo list chứa request ids
2. Khởi tạo list chứa driver ids cho mỗi request
3. Lần lượt lấy ra các driver id trong list `driver_ids` chứa các driver ids từ dataset gốc
4. Sinh ra label cho mỗi request với xác suất 0.3 cho label `0` và 0.7 cho label `1`. 2 con số này có thể là bất kì
5. Tạo `DataFrame` chứa `request_data`

Như vậy là chúng ta vừa tạo xong `request_data` chứa thông tin về request sẽ được gửi tới Online serving API và label tương ứng của mỗi request. Tiếp theo, chúng ta sẽ test các datasets được sinh ra và cách sử dụng Evidently để phát hiện data drift và đánh giá model performance.

### Test datasets

Code dùng để test các datasets và cách dùng Evidently được đặt tại `monitoring_service/nbs/test_datasets.ipynb`. Mình sẽ tóm tắt nội dung code như sau.

Đầu tiên, chúng ta load datasets đã tạo và khởi tạo một số object. Các bạn hãy ấn vào phần chú thích của từng dòng để hiểu về mục đích của các dòng.

```python linenums="1" title="monitoring_service/nbs/test_datasets.ipynb"
normal_df = pd.read_parquet(ORIG_DATA_PATH, engine='fastparquet') # (1)
drift_df = pd.read_parquet(DRIFT_DATA_PATH, engine='fastparquet') # (2)
request_df = pd.read_csv(REQUEST_DATA_PATH) # (3)

column_mapping = ColumnMapping( # (4)
    target="trip_completed", # (5)
    prediction="prediction", # (6)
    numerical_features=["conv_rate", "acc_rate", "avg_daily_trips"], # (7)
    categorical_features=[], # (8)
)

features_and_target_monitor = ModelMonitoring(monitors=[DataDriftMonitor()]) # (9)
model_performance_monitor = ModelMonitoring(monitors=[ClassificationPerformanceMonitor()]) # (10)
```

1. Đọc `normal_data`
2. Đọc `drift_data`
3. Đọc `request_data`
4. `ColumnMapping` là 1 class trong Evidently dùng để định nghĩa loại data của các cột của data
5. Định nghĩa cột `target`, hay chính là label
6. Định nghĩa cột `prediction`, hay chính là dự đoán của model
7. Định nghĩa các cột là features ở dạng số
8. Định nghĩa các cột là features ở dạng categorical
9. Định nghĩa 1 object `ModelMonitoring` để theo dõi data drift
10. Định nghĩa 1 object `ModelMonitoring` để theo dõi model performance

`ModelMonitoring` là 1 class trong Evidently. Class này định nghĩa các loại monitoring mà chúng ta muốn chạy. Có nhiều loại monitoring như `DataDriftMonitor`, `CatTargetDriftMonitor`, `NumTargetDriftMonitor`, v.v.

Khi chạy monitoring, chúng ta cần truyền vào 2 bộ datasets sẽ dùng để so sánh. Nếu 2 bộ data dùng để so sánh là giống nhau cho cùng một loại monitoring, thì chúng ta có thể định nghĩa nhiều loại monitoring trong cùng 1 object `ModelMonitoring`. Tuy nhiên, 2 datasets mà chúng ta sử dụng để theo dõi data drift và model performance là khác nhau, nên chúng ta cần tạo ra 2 objects `ModelMonitoring`. 2 datasets này sẽ được giải thích kĩ hơn ngay sau đây.

Tiếp theo, chúng ta sẽ chạy kiểm tra data drift và model performance.

```python linenums="1" title="monitoring_service/nbs/test_datasets.ipynb"
features_and_target_monitor.execute( # (1)
    reference_data=normal_df, # (2)
    current_data=drift_df, # (3)
    column_mapping=column_mapping,
)

predictions = [1] * drift_df.shape[0]
drift_df = drift_df.assign(prediction=predictions) # (4)
drift_df = drift_df.assign(trip_completed=request_df["trip_completed"]) # (5)

model_performance_monitor.execute( # (6)
    reference_data=drift_df,
    current_data=drift_df,
    column_mapping=column_mapping,
)
```

1. Chạy kiểm tra data drift, so sánh `drift_data` với `normal_data`
2. Dùng `normal_data` làm `reference_data`, mang ý nghĩa là training data
3. Dùng `drift_data` làm `current_data`, mang ý nghĩa là data ở production, để so sánh với training data
4. Thêm cột `prediction` vào `drift_data`, hay chính là dự đoán của model. Như đã phân tích ở phần trước, predictions của model luôn là `1`
5. Thêm cột `trip_completed` vào `drift_data`, hay chính là label của mỗi record
6. Chạy kiểm tra model performance, so sánh `drift_data` với chính nó

!!! question

    Tại sao chúng ta lại kiểm tra model performance bằng cách so sánh `drift_data`, hay data ở production, với chính nó?

Trong Evidently, với loại monitoring là `ClassificationPerformanceMonitor`, nếu cả `reference_data` và `current_data` đều chứa prediction và label, thì Evidently sẽ tính toán các metrics cho model performance trên cả 2 datasets này, và thực hiện so sánh xem các metrics đó khác nhau thế nào. Tuy nhiên, để đơn giản hoá, chúng ta chỉ cần biết model performance của model với data ở production thôi, chứ không cần so sánh model performance giữa 2 datasets `reference_data` và `current_data`. Do đó, chúng ta sẽ truyền vào `drift_data` cho cả 2 loại datasets này.

Kết quả được in ra sau khi chạy sẽ giống như sau.

```bash
data_drift:n_drifted_features | 3 | None # (1)
data_drift:dataset_drift | True | None # (2)
...

classification_performance:quality | 0.4 | {'dataset': 'reference', 'metric': 'accuracy'} # (3)
classification_performance:class_quality | 0.0 | {'dataset': 'reference', 'class_name': '0', 'metric': 'precision'} # (4)
...
```

1. Số features bị drift
2. Dataset `current_data` có bị drift không
3. `accuracy` của model
4. `precision` của model cho class `0`

Để tìm hiểu thêm về các loại monitoring khác hay các chức năng khác của Evidently, các bạn có thể xem thêm các ví dụ tại [website của Evidently](https://docs.evidentlyai.com/examples).

## Monitoring service

### Phát triển

### Tích hợp với Online serving

### Triển khai Grafana dashboards

## Thử nghiệm

## Tổng kết
