## Giới thiệu
Ở bài học về `data-pipeline`, chúng ta đã cùng nhau xây dựng và deploy các data pipeline theo những bước như sau:

- Đóng gói code và môi trường thành image để chạy các bước trong pipeline
- Thực hiện kiểm thử
- Copy file `dag` sang thư mục `dags/` của `Airflow`

Nếu chúng ta tự động hóa các bước này thì có thể đẩy nhanh quá trình release pipeline version mới trên Airflow sau khi thay đổi code.
Ở bài học này chúng ta sẽ tự động hóa quá trình trên. Từ đó, chúng ta có thể sử dụng tương tự cho training pipeline.

## Jenkins pipeline
Với bài toán của chúng ta, thì có thể thiết kế `data pipeline` của chúng ta theo 3 bước như sau: 

- **Bước 1:** Build image chứa code và môi trường chạy code
- **Buốc 2:** Kiểm thử (mọi người tham khảo bài viết `kiểm thử hệ thống`)
- **Bước 3:** Deploy pipeline bằng cách copy file dag

## Tổng kết