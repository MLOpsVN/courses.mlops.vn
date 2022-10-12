<figure>
    <img src="../../../assets/images/mlops-crash-course/monitoring/tong-quan-monitoring/cat-observe.jpg" loading="lazy"/>
    <figcaption>Photo by <a href="https://unsplash.com/@milada_vigerova?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Milada Vigerova</a> on <a href="https://unsplash.com/s/photos/observe?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a></figcaption>
</figure>

## Giới thiệu

Trong bài trước, chúng ta đã triển khai model lên Batch serving pipeline và Online serving service. Triển khai model xong không phải là kết thúc dự án. Model performance cần được theo dõi sau khi triển khai để cải thiện model kịp thời. Có khá nhiều lý do khi model performance giảm, tiêu biểu như:

- Tính chất thống kê của features, labels ở production khác với khi training
- Tính chất thống kê của labels ở production không đổi so với khi training, nhưng cách data được label bị thay đổi
- Quá trình thu thập data và cập nhật Feature Store bị lỗi
- Data bị cập nhật sai
- Quá trình feature engineering lúc training và lúc inference không khớp
- v.v.

Ngoài model performance, logs, tài nguyên tính toán, và các thông số khác của hệ thống cũng cần được theo dõi theo thời gian thực, để xử lý các vấn đề của hệ thống kịp thời ở production. Một số lỗi có thể kể đến như:

- Phiên bản của các thư viện, tools không tương thích
- Lỗi liên quan tới quyền truy cập vào file
- CPU của một server bị quá nóng
- Số requests trung bình trong một giây

Trong bài này, chúng ta sẽ tìm hiểu các metrics điển hình cần được theo dõi trong một hệ thống ML và cách triển khai hệ thống theo dõi các metrics này.

## Theo dõi hệ thống

Thông thường, có ba mảng sau cần được theo dõi trong một hệ thống phần mềm:

1. Mạng máy tính
1. Tài nguyên tính toán
1. Ứng dụng

Một số ví dụ về metrics trong các mảng trên như:

- Độ trễ, thông lượng
- Số requests trong một phút, tỉ lệ số requests có status code là 200
- Mức độ sử dụng CPU, GPU, và memory, v.v.

Những metrics này được gọi là _operational metrics_, tạm dịch là _metrics hệ thống_.

Trong bài sau, chúng ta sẽ dùng Prometheus để thu thập các metrics trên từ máy local, và BentoML để thu thập các metrics liên quan tới Online serving API.

## Theo dõi data và model

Trong một hệ thống ML, metrics về data và model cũng cần được theo dõi. Các metrics này được gọi là ML metrics, và được chia thành bốn nhóm. Bảng dưới đây chỉ ra thông tin về bốn nhóm metrics và ví dụ về các metrics trong các nhóm đó.

| #   | Nhóm      | Metrics                                                                                                                              |
| --- | --------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Input thô | Đầu vào nhận được từ request gửi tới Online serving API                                                                              |
| 2   | Feature   | Để theo dõi sự thay đổi các thuộc tính thống kê của features                                                                         |
| 3   | Dự đoán   | Dự đoán của model, để theo dõi model performance, và sự thay đổi các thuộc tính thống kê của dự đoán của model                       |
| 4   | Label     | Lượt click chuột, mua hàng, yêu thích, chia sẻ, v.v, để theo dõi model performance, và sự thay đổi các thuộc tính thống kê của label |

Metrics ở các nhóm sau chính là sự biến đổi của các metrics từ các nhóm trước đó. Metrics càng ở các nhóm sau thì càng có ý nghĩa gần với mục tiêu của dự án.

## Công cụ theo dõi

Một bộ công cụ phù hợp giúp chúng ta đo lường, theo dõi, và hiểu ý nghĩa của các metrics trong một hệ thống phần mềm. Các công cụ phổ biến được kể đến như logs, dashboards, và alerts.

### Logs

Logs là một thành phần không thể thiếu trong các hệ thống phần mềm. Logs giúp bạn debug nhanh hơn trong lúc phát triển, và đặc biệt khi hệ thống được triển khai ra production.

Trong quá trình phát triển hệ thống, logs có thể chỉ cần ghi ra bash terminal. Nhưng ở production, khả năng cao là logs sẽ được in ra ở trong một Docker container. Để kiểm tra được logs trong một Docker container, bạn sẽ dùng lệnh `docker logs <container-id>` hoặc `kubectl logs <pod-name> -c <container-name>`. Việc này rất mất thời gian, vì bạn cần kiểm tra xem `container-id` là gì, hay `pod-name` là gì. Không chỉ vậy, ở production, có rất nhiều replicas của một service, khiến cho việc kiểm tra logs bằng tay sẽ rất khó khăn trong một hệ thống lớn. Thay vào đó, logs của các services sẽ được tập trung vào một nơi để thuận tiện tìm kiếm, giúp cho việc debug trở nên thuận tiện hơn rất nhiều.

Trong bài sau, chúng ta sẽ dùng ELK Stack (Elasticsearch, Logstash và Kibana) làm giải pháp theo dõi logs của Online serving service.

### Dashboards

Dashboards hiển thị một bức tranh toàn cảnh về các metrics trong một hệ thống, ở dạng mà con người dễ hiểu nhất, và sắp xếp hợp lý gọn gàng tuỳ thuộc vào yêu cầu của mỗi chức năng trong hệ thống. Dựa vào những gì được hiển thị trên dashboards, chúng ta còn biết được mối quan hệ giữa các metrics, và tìm ra nguyên nhân của vấn đề đang gặp phải ở production mà không cần phải kiểm tra data, code, hay logs.

Trong bài sau, chúng ta sẽ dùng Grafana để làm dashboards hiển thị các metrics hệ thống và ML metrics.

### Alerts

Alerts giúp cảnh báo tới đúng người, đúng thời điểm, khi một metrics ở trạng thái bất thường. Ví dụ khi một metric vượt quá một threshold, hay khi data bị drift (các tính chất thống kê của data bị thay đổi).

Một alert thường gồm ba thành phần:

1. Chính sách (_Policy_): điều kiện để xảy ra alert
2. Kênh thông báo (_Channel_): khi cảnh báo xảy ra, ai sẽ được thông báo, bằng cách nào
3. Mô tả (_Description_): mô tả cảnh báo về chuyện gì đang xảy ra

Trong bài sau, chúng ta sẽ dùng Grafana để thiết lập một alert khi dataset bị drift.

## Tổng kết

Để xây dựng một hệ thống ML thành công, monitoring platform là tối quan trọng. Bạn sẽ không biết trước được chuyện gì hay bug nào sẽ xảy ra. Vì vậy, hãy chuẩn bị cho nó!

Trong bài tiếp theo, chúng ta sẽ triển khai ELK Stack, Prometheus server, Grafana server, và viết Monitoring service để theo dõi các metrics liên quan tới hoạt động của hệ thống, data và ML model.

## Tài liệu tham khảo

- [CS 329S. Lecture 10. Data Distribution Shifts and Monitoring](https://docs.google.com/document/d/14uX2m9q7BUn_mgnM3h6if-s-r0MZrvDb-ZHNjgA1Uyo/edit)
