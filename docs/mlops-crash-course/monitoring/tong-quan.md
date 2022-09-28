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

Trong bài này, chúng ta sẽ tìm hiểu các vấn đề về theo dõi một hệ thống Machine Learning và các giải pháp khả thi mà chúng ta sẽ triển khai trong khoá học này.

## Logs

Logs là một thành phần không thể thiếu trong các hệ thống phần mềm. Logs giúp chúng ta debug nhanh hơn trong lúc phát triển, và đặc biệt là khi hệ thống đã được triển khai ra production.

Trong quá trình phát triển hệ thống, chúng ta có thể chỉ cần ghi log ra bash terminal. Nhưng ở production, logs của chúng ta sẽ được in ra ở trong một Docker container. Để kiểm tra được logs trong một Docker container, chúng ta cần phải gõ lệnh `docker logs <container-id>` hoặc `kubectl logs <pod-name> -c <container-name>`. Tuy nhiên, việc này rất mất thời gian, vì chúng ta cần đi kiểm tra xem `container-id` là gì, hay `pod-name` là gì. Không chỉ vậy, ở production, có rất nhiều replicas của một service, khiến cho việc kiểm tra logs bằng tay như vậy là không khả thi với một hệ thống lớn.

Giải pháp đưa ra là chúng ta sẽ tập trung logs của các services vào một chỗ mà ở đó, chúng ta có thể kiểm tra logs của các services khác nhau trong các ứng dụng khác nhau dễ dàng và nhanh chóng, giúp cho việc debug trở nên thuận tiện hơn rất nhiều.

Trong khoá học này, chúng ta sẽ sử dụng ELK Stack (Elasticsearch, Logstash và Kibana) để làm nơi theo dõi logs của Online serving service.

## Theo dõi hệ thống

## Theo dõi chất lượng data

## Theo dõi model performance
