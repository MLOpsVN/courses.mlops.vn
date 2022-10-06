## Giới thiệu
Ở bài học trước, chúng ta đã xây dựng CI/CD cho `data pipeline`, từ đó có thể làm tương tự cho `training pipeline`. Tuy nhiên, đối với `model serving` thì CI/CD pipeline sẽ hơi phức tạp hơn một chút, do chúng ta sẽ cần deploy đồng thời `serving pipeline` và API. Trong bài học hôm nay, chúng ta sẽ cùng nhau tìm hiểu về cách thiết kế và triển khai CI/CD cho `model serving`.

## Jenkins pipeline
Chúng ta sẽ viết Jenkinsfile cho 3 bước trên như sau:
```py title="Jenkinsfile" linenums="1"
placeholder
```

## Tổng kết