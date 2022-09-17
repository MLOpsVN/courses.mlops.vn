Airflow là một nền tảng cung cấp SDK và UI để hỗ trợ xây dựng, đặt lịch thực thi và theo dõi các pipeline.
Một số khái niệm cơ bản trong Airflow:

- **task:** một thành phần (hoặc một bước) trong pipeline
- **DAG:** định nghĩa thứ tự thực thi, lịch chạy và số lượng lần retry.v.v. cho các *task*

Để tạo ra *task*, chúng ta sẽ dùng các *operators* cung cấp bởi Airflow SDK. Một số loại *operator* phổ biến bao gồm:

- **BashOperator:** thực thi các bash command
- **PythonOperator:** thực thi các Python script
- **EmailOperator:** gửi email
- **DockerOperator:** thực hiện các command bên trong docker container
- **MySQLOperator:** thực thi các MySQL query
, ngoài ra còn rất nhiều *operator* khác được phát triển bởi cộng đồng, mọi người xem thêm tại [đây](https://airflow.apache.org/docs/apache-airflow-providers/operators-and-hooks-ref/index.html)

Ở series này chúng ta sẽ sử dụng DockerOperator để chạy các Python script và BashOperator để thực thi các bash command. Việc sử dụng DockerOperator thay cho PythonOperator đảm bảo môi trường chạy code được đóng gói và có thể chạy code này ở trên bất kỳ máy nào mà không bị các vấn đề về cài đặt hoặc xung đột thư viện.

