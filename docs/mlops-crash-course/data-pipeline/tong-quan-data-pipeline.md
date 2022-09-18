Từ xưa một ông nào đó giấu tên đã có câu *garbage in, garbage out*, được hiểu rằng dữ liệu đầu vào mà rác thì kết quả đầu ra cũng không thể dùng được. Như vậy công đoạn chuẩn bị dữ liệu là cực kỳ quan trọng, nhất là đối với các ứng dụng có hiệu năng bị chi phối mạnh mẽ bởi dữ liệu như ML. Theo thống kê của [Forbes](https://www.forbes.com/sites/gilpress/2016/03/23/data-preparation-most-time-consuming-least-enjoyable-data-science-task-survey-says), các Data Scientist dành tới 80% thời gian cho các công việc liên quan tới xử lý dữ liệu, đủ để hiểu rằng data engineering là một quá trình rất phức tạp và tốn nhiều thời gian. 

Thông thường công việc xử lý dữ liệu bao gồm các công đoạn chính như sau:

| Tên công đoạn  | Công việc cụ thể |
| --------------    | ------- |
| Data ingestion    | **Data provenance:** lưu trữ thông tin về các dữ liệu nguồn |
|    | **Metadata catalog:** lưu trữ thông tin về dữ liệu bao gồm: kích thước, định dạng, người sở hữu, người có quyền truy cập, thời gian sửa đổi gần nhất, .v.v.  |
|    | **Data formatting:** chuyển dữ liệu sang format khác để dễ dàng xử lý |
|    | **Privacy Compliance:** đảm bảo các dữ liệu nhạy cảm (PII), ví dụ thông tin họ tên khách hàng đi kèm CMND/CCCD, đã được ẩn đi |
| Data cleaning | Xử lý outlier/missing values  |
|    | Loại bỏ các features không liên quan hoặc các sample bị lặp lại  |
|    | Thay đổi thứ tự các cột  |
|    | Thực hiện các phép biến đổi |
| Data exploration & validation | **Data profiling:** hiển thị thông tin cơ bản về các feature như kiểu dữ liệu, tỉ lệ missing value, phân bố dữ liệu, các con số thống kê như *min*, *max*, *mean*, .v.v. |
|    | **Visualization:** xây dựng các dashboard về phân bố hoặc độ skew của dữ liệu |
|    | **Validation:** sử dụng các user-defined rule (ví dụ như *tỉ lệ missing value < 80%*), hoặc dựa vào thống kê để xác định độ lệch phân bố |