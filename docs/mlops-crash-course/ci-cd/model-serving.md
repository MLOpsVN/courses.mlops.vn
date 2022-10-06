## Giới thiệu
Ở bài học về `data pipeline`, chúng ta đã cùng nhau xây dựng và deploy data pipeline theo các bước như sau:

- Đóng gói code và môi trường thành image để chạy các bước trong pipeline
- Thực hiện kiểm thử code
- Copy file `dag` sang thư mục `dags/` của `Airflow`

Nếu chúng ta tự động hóa các bước này thì có thể đẩy nhanh quá trình release pipeline version mới trên Airflow sau khi thay đổi ở code.
Ở bài học này chúng ta sẽ tự động 3 bước trên cho `data pipeline`. Từ đó, chúng ta có thể ứng dụng tương tự với training pipeline.

## Jenkins pipeline
Chúng ta sẽ viết Jenkinsfile cho 3 bước trên như sau:
```py title="Jenkinsfile" linenums="1"
placeholder
```

## Tổng kết