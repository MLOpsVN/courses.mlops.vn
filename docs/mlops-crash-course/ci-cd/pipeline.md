## Giới thiệu
Ở bài học về `data pipeline`, chúng ta đã cùng nhau xây dựng và deploy data pipeline theo các bước như sau:

- Đóng gói code và môi trường thành image để chạy các bước trong pipeline
- Thực hiện kiểm thử code
- Copy Python script định nghĩa `DAG` sang thư mục `dags/` của `Airflow`

Nếu chúng ta tự động hóa các bước này thì có thể đẩy nhanh quá trình release version mới cho pipeline mỗi khi developer thay đổi code.
Ở bài học này chúng ta sẽ sử dụng Jenkins để làm điều này.

## Jenkins pipeline
Chúng ta sẽ viết Jenkinsfile cho 3 bước trên như sau:

```mermaid
flowchart LR
    n1[1. Build data pipeline] --> n2[2. Test data pipeline] --> n3[3. Deploy data pipeline]
```

???+ info
    Ở bài học này chúng ta sẽ sử dụng docker agent, do đó trước hết mọi người phải truy câp <http://localhost:8081/pluginManager/> và cài đặt thêm plugin `Docker Pipeline`.

```py title="Jenkinsfile" linenums="1"
pipeline {
    agent { 
        docker { 
            image 'python:3.9'
        } 
    }

    stages {
        stage('build data pipeline') {
            when {changeset "data_pipeline/**" }

            steps {
                echo 'Building data pipeline..'
                sh 'cd data_pipeline && make build_image'  # (1)
            }
        }

        stage('test data pipeline') {
            when {changeset "data_pipeline/**" }

            steps {
                echo 'Testing data pipeline..'  # (2)
            }
        }

        stage('deploy data pipeline') {
            when {changeset "data_pipeline/**" }

            steps {
                sh 'cd data_pipeline && make deploy_dags' # (3)
            }
        }
    }
}
```

1. Build image cho để chạy các bước trong Airflow pipeline
2. Test code, phần này mọi người sẽ bổ sung `unit test`, `integration test`, .v.v. dựa vào bài học về `kiểm thử hệ thống`
3. Copy script chứa `DAG` qua folder `dags/` của Airflow

???+ warning
    Nếu mọi người gặp hiện tượng Github API Rate Limit như sau:
    <img src="../../../assets/images/mlops-crash-course/ci-cd/jenkins-error-rate-limit.png" loading="lazy" />
    
    , thì mọi người thêm Credentials ở mục Github bằng cách ấn vào `Add` như hình dưới: 
    <img src="../../../assets/images/mlops-crash-course/ci-cd/jenkins-rate-limit.png" loading="lazy" />

## Tổng kết
Ở bài học vừa rồi, chúng ta đã sử dụng Jenkins để xây dựng một CI/CD pipeline với 3 bước: buid image, test code và deploy Airflow pipeline. Developer bây giờ chỉ cần tập trung vào code, khi nào code xong thì `push` lên Github và để luồng CI/CD lo những phần còn lại, thật tiện lợi phải không nào!

Ở bài học tiếp theo, chúng ta sẽ xây dựng một CI/CD pipeline phức tạp hơn một chút cho `model serving`.
