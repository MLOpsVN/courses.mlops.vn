<figure>
    <img src="../../assets/images/mlops-crash-course/data-pipeline/automation.jpg" loading="lazy"/>
    <figcaption>Photo from <a href="https://airflow-tutorial.readthedocs.io/en/latest/pipelines.html">airflow-tutorial</a></figcaption>
</figure>

## Giới thiệu

Nếu ở bài trước, chúng ta đi vào tìm hiểu tại sao phải xây dựng pipeline, thì bài học này sẽ giúp bạn hình dung rõ hơn về cách xây dựng pipeline thông qua Airflow.

## Các khái niệm cơ bản

Airflow là một nền tảng cung cấp SDK và UI để hỗ trợ xây dựng, đặt lịch thực thi và theo dõi các pipeline.
Một số khái niệm cơ bản trong Airflow:

- **task:** một thành phần (hoặc một bước) trong pipeline
- **DAG:** định nghĩa thứ tự thực thi, lịch chạy và số lượng lần retry.v.v. cho các _task_

### Task

Để tạo ra _task_, chúng ta sẽ dùng các _operators_ cung cấp bởi Airflow SDK. Một số loại _operator_ phổ biến bao gồm:

- **BashOperator:** thực thi các bash command
- **PythonOperator:** thực thi các Python script
- **EmailOperator:** gửi email
- **DockerOperator:** thực hiện các command bên trong docker container
- **MySQLOperator:** thực thi các MySQL query, ngoài ra còn rất nhiều _operator_ khác được phát triển bởi cộng đồng, bạn xem thêm tại [đây](https://airflow.apache.org/docs/apache-airflow-providers/operators-and-hooks-ref/index.html)

Ở series này chúng ta sẽ chủ yếu sử dụng 2 loại operators là _DockerOperator_ và _BashOperator_.

???+ tip

    Việc sử dụng DockerOperator thay cho PythonOperator đảm bảo môi trường chạy code được đóng gói và có thể chạy code này ở trên bất kỳ máy nào mà không bị các vấn đề về cài đặt hoặc xung đột thư viện.

### DAG

Sau khi đã code xong các _task_, chúng ta sẽ đưa các _task_ này vào trong DAG như ví dụ sau:

```py linenums="1"
with DAG(
    "my_dag_name", start_date=pendulum.datetime(2021, 1, 1, tz="UTC"),  # (1)
    schedule="@daily", catchup=False
) as dag:
    ingest_task = PythonOperator(...) # (2)
    clean_task = PythonOperator(...)
    validate_task = PythonOperator(...)
    ingest_task >> clean_task >> [explore_task, validate_task] # (3)
```

1. Định nghĩa thời gian bắt đầu chạy pipeline từ 1/1/2021, lịch chạy là daily và không catchup, tức là không chạy pipeline trước _start_date_
2. Định nghĩa _task_ bằng `PythonOperator`. Bạn tự truyền các config vào `(...)`
3. **Thứ tự chạy:** _ingest_task_ tới _clean_task_, cuối cùng là 2 task song song: _explore_task và \_validate_task_

## Tổng kết

Ở bài học hôm nay, chúng ta đã tìm hiểu về một số khái niệm cơ bản trong Airflow và làm quen với Airflow Python SDK để xây dựng _task_ và _DAG_. Bài học tiếp theo, chúng ta sẽ cụ thể hóa việc xây dựng pipeline bằng cách ứng dụng vào một bài toán cụ thể.

## Tài liệu tham khảo

- <https://airflow.apache.org/docs/apache-airflow/stable/concepts/operators.html>
