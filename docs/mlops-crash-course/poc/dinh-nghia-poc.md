## Mục tiêu

Trong bài này, chúng ta sẽ cùng nhau xây dựng một dự án POC. Dự án POC sẽ giúp chúng ta thử nghiệm các giải pháp nhanh chóng để chứng minh được rằng tồn tại ít nhất một giải pháp giải quyết được vấn đề kinh doanh, trước khi bắt tay vào xây dựng các tính năng phức tạp khác. Vì chúng ta đang chọn ML làm giải pháp nên ở bước xây dựng dự án POC này, chúng ta sẽ đi chứng minh rằng giải pháp ML là khả thi.

## Định nghĩa POC

Trong bài trước, chúng ta đã cùng phân tích vấn đề kinh doanh và đã trả lời được các câu hỏi sau:

-   Data được lấy từ đâu?
-   Data sẽ được transform, clean, và lưu trữ thế nào?
-   Các feature tiềm năng là gì?
-   Các ML model tiềm năng?
-   Dùng metrics nào để đánh giá model?

TODO: vẽ bảng các câu hỏi và câu trả lời

Ở bước xây dựng dự án POC này, chúng ta cần trả lời thêm một câu hỏi nữa, đó là: _Thế nào là một dự án POC thành công?_

Vì những dự án POC đầu tiên chưa thể đưa ML model ra môi trường production để trích xuất ra metric cuối cùng để đánh giá ML model được, nên chúng ta cần phải sử dụng metrics đã được định nghĩa ở trên để đánh giá ML model. Cụ thể, chúng ta cần phải đặt một threshold cho các metrics này. Trong khoá học này, chúng ta sử dụng metric Accuracy, và threshold để định nghĩa dự án POC thành công là Accuracy phải lớn hơn **0.8**.

Lưu ý: dự án POC chỉ là một vòng lặp khi xây dựng hệ thống. Ở những dự án POC đầu tiên, cách đánh giá model có thể chỉ là dùng offline metric. Càng về các giai đoạn sau, khi hệ thống đã được triển khai ra production, các online metric sẽ được dùng để đánh giá giải pháp ở giai đoạn đó.

Lưu ý: Một số metric khác được sử dụng như:

-   Sử dụng cả metric Accuracy, F1, AUC để đánh giá model performance
-   Sử dụng thời gian training và inference của ML model để so sánh chi phí và lợi ích

Sau khi đã định nghĩa được thế nào là một dự án POC thành công, ở bước tiếp theo, chúng ta sẽ bắt tay vào thực hiện dự án POC.

## Infra layer

Trong quá trình xây dựng POC, ngoài vấn đề về data, feature, model, metric, và threshold để đánh giá ra, chúng ta còn cần một platform cho phép chúng ta thực hiện các thử nghiệm nhanh chóng, với khả năng version data, version các bộ feature, version các thử nghiệm model cùng các bộ hyperparameter, các metric thể hiện model performance, và thậm chí cả các ghi chú của Data Scientist ở mỗi thử nghiệm. Dựa vào các thông tin metadata này, Data Scientist có thể phân tích xem bộ feature nào, model architecture nào, bộ hyperparameter nào có khả năng sinh ra model tốt nhất. Trong khoá học này, chúng ta sẽ sử dụng MLOps Platform đã được giới thiệu trong bài trước, và cụ thể là MLflow sẽ đóng vai trò chính để log lại các thử nghiệm này.

Thông thường, một công ty sẽ có một nhóm các Infra engineer làm nhiệm vụ xây dựng Infra layer. Chức năng chính của Infra layer là quản lý và cung cấp tài nguyên tính toán và lưu trữ cho các ứng dụng ở các layer trên nó. Infra layer có thể được xây dựng đơn giản sử dụng `docker-compose`, Docker Swarm, hoặc phức tạp hơn như Kubernetes. Trong khoá học này, giả sử rằng chúng ta sử dụng `docker-compose` ở Infra layer.

TODO: vẽ Infra layer, Enterprise Application layer (ví dụ bằng nhiều ứng dụng)

Trên Infra layer là Enterprise Application layer, hay chính là nơi mà các engineer khác xây dựng các ứng dụng cho chính công ty đó. Các ứng dụng này có thể là môi trường Jupyter notebook, Gitlab server, Jenkins server, monitoring platform, v.v. Trong khoá học này, giả sử rằng chúng ta đã triển khai MLOps platform xong trên Infra layer. Lưu ý, MLOps platform này đã cung cấp môi trường Jupyter notebook để Data Scientist sử dụng trong quá trình thử nghiệm.

Trong bài tiếp theo, chúng ta sẽ học cách sử dụng MLOps platform để xây dựng POC.
