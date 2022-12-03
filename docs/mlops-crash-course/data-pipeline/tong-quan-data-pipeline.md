<figure>
    <img src="../../../assets/images/mlops-crash-course/data-pipeline/broken-data-pipeline.jpeg" loading="lazy"/>
    <figcaption>Photo by <a href="https://barrmoses.medium.com/?source=post_page-----4d42c2a8f054--------------------------------">Barr Moses</a> on <a href="https://barrmoses.medium.com/the-broken-data-pipeline-before-christmas-4d42c2a8f054">Medium</a></figcaption>
</figure>

## Giới thiệu

Trong khoa học máy tính có khái niệm _garbage in, garbage out_, được hiểu rằng dữ liệu đầu vào mà rác thì kết quả đầu ra cũng không thể dùng được. Như vậy công đoạn chuẩn bị dữ liệu là cực kỳ quan trọng, nhất là đối với các ứng dụng có hiệu năng bị chi phối mạnh mẽ bởi dữ liệu như ML. Theo thống kê của [Forbes](https://www.forbes.com/sites/gilpress/2016/03/23/data-preparation-most-time-consuming-least-enjoyable-data-science-task-survey-says), các Data Scientist dành tới 80% thời gian cho các công việc liên quan tới xử lý dữ liệu, đủ để hiểu rằng data engineering là một quá trình rất phức tạp và tốn nhiều thời gian.

Ở bài học này, chúng ta sẽ cùng nhau tìm hiểu các công việc phổ biến trong xử lý dữ liệu, khái niệm về pipeline dữ liệu, từ đó bạn có thể rút ra được những việc cần làm cho bài toán của mình và lên kế hoạch triển khai cho phù hợp.

## Các công đoạn chính trong xử lý dữ liệu

Thông thường công việc xử lý dữ liệu bao gồm các công đoạn chính như sau:

| Tên công đoạn                 | Công việc cụ thể                                                                                                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Data ingestion                | **Data provenance:** lưu trữ thông tin về các dữ liệu nguồn                                                                                                              |
|                               | **Metadata catalog:** lưu trữ thông tin về dữ liệu bao gồm: kích thước, định dạng, người sở hữu, người có quyền truy cập, thời gian sửa đổi gần nhất, .v.v.              |
|                               | **Data formatting:** chuyển dữ liệu sang format khác để dễ dàng xử lý                                                                                                    |
|                               | **Privacy Compliance:** đảm bảo các dữ liệu nhạy cảm (PII), ví dụ thông tin họ tên khách hàng đi kèm CMND/CCCD, đã được ẩn đi                                            |
| Data cleaning                 | Xử lý outlier/missing values                                                                                                                                             |
|                               | Loại bỏ các features không liên quan hoặc các sample bị lặp lại                                                                                                          |
|                               | Thay đổi thứ tự các cột                                                                                                                                                  |
|                               | Thực hiện các phép biến đổi                                                                                                                                              |
| Data exploration & validation | **Data profiling:** hiển thị thông tin cơ bản về các feature như kiểu dữ liệu, tỉ lệ missing value, phân bố dữ liệu, các con số thống kê như _min_, _max_, _mean_, .v.v. |
|                               | **Visualization:** xây dựng các dashboard về phân bố hoặc độ skew của dữ liệu                                                                                            |
|                               | **Validation:** sử dụng các user-defined rule (ví dụ như _tỉ lệ missing value < 80%_), hoặc dựa vào thống kê để xác định độ lệch phân bố                                 |

## Pipeline xử lý dữ liệu

Sau khi đã nắm rõ các đầu việc cần phải làm, chúng ta sẽ chia các công việc đó thành các module để các thành viên trong team có thể bắt đầu implement. Việc chia module có thể dựa theo công đoạn như ở phần trên, đó là 3 module: _data ingestion_, _data cleaning_, và _data exploration & validation_ hoặc chia nhỏ thêm nữa để dễ maintain và scale hơn.

Các module xử lý dữ liệu chạy theo tuần tự tạo thành một pipeline xử lý dữ liệu, ví dụ bên dưới:

[//]: # (```mermaid)

[//]: # (flowchart LR)

[//]: # (    n1[ingest_task] --> n2[clean_task] --> n3[explore_and_validate_task])

[//]: # (```)

<figure>
    <img src="../../../assets/images/mermaid-diagrams/tong-quan-pipeline.png" loading="lazy"/>
</figure>

???+ tip

    Số lượng module quá nhiều có thể dẫn tới một số vấn đề như:

    - Pipeline trở nên cực kỳ phức tạp và khó debug
    - Việc pass dữ liệu qua lại giữa các module xảy ra nhiều lên làm tăng thời gian hoàn thành của pipeline
    - Dễ gây lãng phí computing resource nếu không xử lý scale hợp lý

## Tổng kết

Ở bài học vừa rồi, chúng ta đã cùng nhau tìm hiểu về các công việc xử lý dữ liệu cho model và ý tưởng chia nhỏ các công việc đó thành các thành phần của pipeline. Ở bài tiếp theo, chúng ta sẽ tìm hiểu về Airflow, một tool giúp xây dựng pipeline.
## Tài liệu tham khảo

- <https://ml-ops.org/content/three-levels-of-ml-software>
- <https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning>
