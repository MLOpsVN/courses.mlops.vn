## Mục tiêu

Sau khi train được một model tốt, chúng ta cần triển khai model. Có hai hình thức triển khai model phổ biến, đó là _batch serving_ và _online serving_.

Cả batch serving và online serving đều có thể xử lý một hoặc nhiều requets. Tuy nhiên, batch serving được tối ưu để xử lý số lượng lớn các requests và thường để chạy các model phức tạp, trong khi online serving thì được tối ưu để giảm thời gian xử lý trong một lần thực thi. Batch serving thường được lên lịch theo chu kì và được xử lý offline. Online serving thì được triển khai lên một server nào đó dưới dạng RESTful APIs để người dùng có thể gọi tới qua internet.

Trong bài này, chúng ta sẽ tìm hiểu cách để triển khai model ở cả hai hình thức batch serving và online serving.

## Batch serving

Trong khoá học này, chúng ta sẽ thiết kế batch serving với input là data file ở local. Chúng ta có thể chỉ cần viết vài script để load input, load model, chạy predictions, và lưu lại chúng. Tuy nhiên, chúng ta cũng có thể coi batch serving là một pipeline và sử dụng Airflow để quản lý và lên lịch cho quá trình chạy batch serving.

Chúng ta sẽ sử dụng Airflow để triển khai batch serving pipeline, với các tasks như hình dưới:

<img src="../../../assets/images/mlops-crash-course/trien-khai-model-serving/tong-quan-model-serving/batch-serving-pipeline-dag.png" loading="lazy" />

### Cập nhật Feature Store

Ở task này, chúng ta đang giả sử nơi chạy Batch serving là ở một server nào đó với infrastructure đủ mạnh cho việc tối ưu chạy batch serving. Khi chạy batch serving, chúng ta cần lấy được data từ Feature Store để phục vụ cho quá trình prediction. Do đó, chúng ta cần cập nhật Feature Store ở trên server nơi chúng ta triển khai batch serving.

Task này giống hệt như task **Cập nhật Feature Store** ở training pipeline. Các bạn có thể xem lại bài [Tổng quan training pipeline](../../xay-dung-training-pipeline/tong-quan-pipeline/#cap-nhat-feature-store).

### Data extraction

Trong task này, chúng ta cần đọc vào data mà chúng ta muốn chạy prediction. Khi đọc vào data, chúng ta cũng cần xử lý data này về input format mà model yêu cầu để tiện cho task **Batch prediction** tiếp theo, bằng cách lấy ra các features từ Feast và định dạng lại data mà chúng ta sẽ chạy prediction. Đầu ra của task này là data đã được xử lý về đúng input format của model và được lưu vào disk.

### Batch prediction

Ở task này, chúng ta sẽ load model sẽ được dùng từ một config file, và chạy prediction trên data đã được xử lý ở task trước. Đầu ra của task này là kết quả predictions và sẽ được lưu vào disk.

Lưu ý, trong khoá học này, chúng ta sẽ không thực hiện kĩ thuật tối ưu nào cho quá trình prediction.

## Online serving

Về cơ bản, quá trình triển khai online serving chính là xây dựng một hoặc nhiều RESTful APIs, và triển khai các APIs này lên một server, cho phép người dùng có thể gọi tới qua internet.

Thông thường, chúng ta sẽ sử dụng một library nào đó để xây dựng API, ví dụ như Flask. Trong khoá học này, chúng ta sẽ sử dụng một library chuyên được dùng cho việc xây dựng online serving cho ML models, đó là _Bentoml_.

## Tổng kết

Trong bài tiếp theo, chúng ta sẽ cùng nhau viết code cho batch serving pipeline và xây dựng API cho online serving.
