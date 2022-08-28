MLOps platform (một số nơi cũng gọi là AI/ML platform) ra đời với mục đích cung cấp cho người dùng các tools cần thiết để triển khai các dự án ML. Ở khóa học này chúng ta sẽ sử dụng một MLOps platform với các thành phần và tool tương ứng như sau:

| Tên thành phần | Ý nghĩa | Tool lựa chọn
| ----------- | ----------- | ----------- |
| Source control | Data và code version control | Git & Github
| CI/CD | Tự động hóa quá trình test và deploy | Github Actions |
| Orchestrator | Xây dựng và quản lý các pipeline | Airflow |
| Model registry | Lưu trữ và quản lý các model | MLFlow |
| Feature store | Lưu trữ, quản lý và tương tác với các feature | Feast (PostgreSQL & Redis backend) |
| Experiment tracking | Lưu trữ thông tin và quản lý các experiment | MLFlow |
| ML Metadata Store | Lưu trữ artifact của các pipeline | MLFlow |
| Monitoring | Theo dõi resource hệ thống, hiệu năng của model và chất lượng dữ liệu trên production | Prometheus & Grafana & ELK |

Như mọi người có thể thấy ở trên, chúng ta có thể sử dụng một tool cho nhiều mục đích khác nhau, ví dụ MLFlow, nhằm hướng tới sử dụng ít tool nhất có thể mà vẫn đáp ứng được nhu cầu. Việc sử dụng quá nhiều tool có thể dẫn tới việc vận hành MLOps platform trở nên cực kỳ phức tạp, đồng thời khiến người dùng dễ bị choáng ngợp trong đống tool do không biết sử dụng như thế nào, và sử dụng như nào cho hiệu quả.

Về mặt high-level, kiến trúc của MLOps platform như sau:

<img src="../../../assets/images/mlops-crash-course/tong-quan-he-thong/mlops-platform/architecture.png" style="width:100%;" />

Các tương tác chính trong MLOps platform:

1\. Airflow data pipeline đẩ y feature vào feature store

2\. Data Scientist (DS) kéo dữ liệu từ offline store về thông qua Feast SDK để thực hiện các experiment: eda, train và tune

3\. DS lưu thông tin mỗi lần thí nghiệm vào MLFlow

4\. DS push code lên Github để trigger các CI/CD pipeline tương ứng: **Đỏ:** push code data pipeline để trigger CI/CD cho data pipeline; **Xanh tím than:** push code model training để trigger CI/CD cho model training pipeline; **Xanh lá:** push code model serving để trigger CI/CD cho model serving

5\. CI/CD pipeline tự động cập nhật pipeline tương ứng (tương tự với 6, 7 và 8)

9\. Prometheus kéo metrics từ model serving API để hiển thị lên Grafana dashboard

10\. Đẩy log về Elastic Search (tương tự với 11, 12 và 13)

14\. Model training pipeline lưu trữ model đi kèm với metadata

15\. CI/CD cho model serving kéo model và metadata từ MLFlow để đóng gói trước khi deploy

16\. Kéo features mới nhất tương ứng với các IDs trong request API để cho qua model dự đoán 

17\. Kéo features về để train model