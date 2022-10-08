<figure>
    <img src="../../../assets/images/mlops-crash-course/monitoring/tong-quan-monitoring/cat-observe.jpg" loading="lazy"/>
    <figcaption>Photo by <a href="https://unsplash.com/@milada_vigerova?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Milada Vigerova</a> on <a href="https://unsplash.com/s/photos/observe?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a></figcaption>
</figure>

## Giới thiệu

Trong bài trước, chúng ta đã triển khai Batch serving và Online serving. Triển khai model xong không phải là kết thúc dự án. Chúng ta còn cần phải theo dõi model sau khi đã triển khai để biết được khi nào hiệu quả hoạt động của model đi xuống để cải thiện model khi cần thiết.

Có khá nhiều lý do cho việc hiệu quả hoạt động của model giảm xuống, tiêu biểu như:

- Các features ở production khác với các features ở training về mặt các đặc trưng thống kê. Ví dụ: mean, variance của các features bị thay đổi
- Phân phối của label ở production khác với phân phối của label lúc training
- Phân phối của label ở production không đổi so với phân phối của label lúc training, nhưng giá trị của label bị thay đổi
- Quá trình thu thập data và cập nhật Feature Store bị lỗi
- Data bị cập nhật sai
- Quá trình feature engineering lúc training và lúc inference không khớp
- v.v.

Ngoài theo dõi hiệu quả hoạt động của model, vì hệ thống của chúng ta là một hệ thống phần mềm, nên đương nhiên chúng ta cũng cần theo dõi log, tài nguyên tính toán, và các thông số khác của hệ thống theo thời gian thực, để xử lý các vấn đề của hệ thống kịp thời ở production. Một số lỗi liên quan tới hệ thống phần mềm có thể kể đến như:

- Phiên bản của các thư viện, tools không tương thích
- Lỗi liên quan tới quyền truy cập vào file
- CPU của một server bị quá nóng
- Một database server bị quá tải về số lượt truy cập

Trong bài này, chúng ta sẽ tìm hiểu các metrics nên được theo dõi trong một hệ thống ML và các giải pháp khả thi mà chúng ta sẽ triển khai trong khoá học này.

## Theo dõi hệ thống

Thông thường, có ba mảng sau chúng ta cần theo dõi trong một hệ thống phần mềm:

1. Mạng máy tính
1. Tài nguyên tính toán
1. Ứng dụng

Một số ví dụ về metrics trong các mảng trên như là: độ trễ, thông lượng, số requests trên một phút, tỉ lệ số requests có status code là 200, mức độ sử dụng CPU, GPU, và memory, v.v. Những metrics này được gọi là _operational metrics_.

Trong bài sau, chúng ta sẽ sử dụng Prometheus để thu thập các metrics trên từ máy tính mà chúng ta đang sử dụng để thực hành khoá học này. Chúng ta cũng sẽ sử dụng Bentoml để thu thập các metrics liên quan tới số requests gửi tới inference API.

## Theo dõi data và model

Trong một hệ thống ML, hiển nhiên rằng chúng ta cần theo dõi các metrics liên quan tới data và model. Các metrics này được gọi là ML metrics, và được chia thành bốn nhóm. Bảng dưới đây chỉ ra thông tin về bốn nhóm metrics và ví dụ về các metrics trong các nhóm đó.

| #   | Nhóm      | Metrics                                                                                                                              |
| --- | --------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Input thô | Đầu vào nhận được từ request gửi tới API                                                                                             |
| 2   | Feature   | Các feature đã được biến đổi từ input thô, để theo dõi sự thay đổi các thuộc tính thống kê của features                              |
| 3   | Dự đoán   | Dự đoán của model, để theo dõi model performance, và sự thay đổi các thuộc tính thống kê của dự đoán của model                       |
| 4   | Label     | Lượt click chuột, mua hàng, yêu thích, chia sẻ, v.v, để theo dõi model performance, và sự thay đổi các thuộc tính thống kê của label |

## Công cụ theo dõi

Một bộ công cụ phù hợp giúp chúng ta đo lường, theo dõi, và hiểu ý nghĩa của các metrics trong một hệ thống phần mềm. Các công cụ phổ biến được kể đến như logs, dashboards, và alerts.

### Logs

Logs là một thành phần không thể thiếu trong các hệ thống phần mềm. Logs giúp chúng ta debug nhanh hơn trong lúc phát triển, và đặc biệt là khi hệ thống đã được triển khai ra production.

Trong quá trình phát triển hệ thống, chúng ta có thể chỉ cần ghi log ra bash terminal. Nhưng ở production, logs của chúng ta sẽ được in ra ở trong một Docker container. Để kiểm tra được logs trong một Docker container, chúng ta cần phải gõ lệnh `docker logs <container-id>` hoặc `kubectl logs <pod-name> -c <container-name>`. Tuy nhiên, việc này rất mất thời gian, vì chúng ta cần đi kiểm tra xem `container-id` là gì, hay `pod-name` là gì. Không chỉ vậy, ở production, có rất nhiều replicas của một service, khiến cho việc kiểm tra logs bằng tay như vậy là không khả thi với một hệ thống lớn.

Giải pháp đưa ra là chúng ta sẽ tập trung logs của các services vào một chỗ mà ở đó, chúng ta có thể kiểm tra logs của các services khác nhau trong các ứng dụng khác nhau dễ dàng và nhanh chóng, giúp cho việc debug trở nên thuận tiện hơn rất nhiều.

Trong bài sau, chúng ta sẽ sử dụng ELK Stack (Elasticsearch, Logstash và Kibana) để làm nơi theo dõi logs của Online serving service.

### Dashboards

Dashboards sẽ giúp chúng ta có một bức tranh toàn cảnh về các metrics trong một hệ thống, hiển thị ở dạng mà con người có thể dễ dàng hiểu nhất, và sắp xếp một cách hợp lý gọn gàng tuỳ thuộc vào yêu cầu của mỗi chức năng của một hệ thống. Dựa vào những gì được hiển thị trên dashboards, chúng ta còn có thể hiểu được mối quan hệ giữa các metrics, và thậm chí lý giải được ngay những vấn đề đang gặp phải mà không cần phải kiểm tra data hay code.

Trong bài sau, chúng ta sẽ sử dụng Grafana để làm dashboards hiển thị những metrics thu thập được từ Prometheus.

### Alerts

Alerts sẽ giúp chúng ta cảnh báo tới đúng người khi một metrics xảy ra hiện tượng bất thường, ví dụ vượt quá một threshold nào đó, hay khi xảy ra _concept drift_. Chúng ta sẽ nói kĩ hơn về concept drift trong bài sau.

Một alert thường gồm có ba thành phần:

1. Chính sách: điều kiện để xảy ra alert
1. Các kênh thông báo: ai sẽ được thông báo, bằng cách nào, khi cảnh báo xảy ra
1. Mô tả: giúp người được cảnh báo hiểu chuyện gì đang xảy ra

Trong bài sau, chúng ta sẽ sử dụng Grafana để thiết lập các alerts cho một số metrics liên quan tới concept drift.

## Tổng kết

Để xây dựng một hệ thống ML thành công, chúng ta cần một infrastructure có thể được theo dõi và bảo trì hiệu quả để chạy các ML models. Chúng ta sẽ không biết trước được chuyện gì hay bug nào sẽ xảy ra trong giây phút tiếp theo. Vì vậy, hãy chuẩn bị cho nó!

Trong bài tiếp theo, chúng ta sẽ học cách triển khai ELK Stack, sử dụng Prometheus, Grafana, và viết Monitoring service để theo dõi các metrics liên quan tới hoạt động của hệ thống, data và ML model.
