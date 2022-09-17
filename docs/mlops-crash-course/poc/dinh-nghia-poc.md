## Mục tiêu

Trong bài này, chúng ta sẽ cùng nhau xây dựng một dự án POC. Dự án POC sẽ giúp chúng ta thử nghiệm các giải pháp nhanh chóng để chứng minh được rằng tồn tại ít nhất một giải pháp giải quyết được vấn đề kinh doanh, trước khi bắt tay vào xây dựng các tính năng phức tạp khác. Vì chúng ta đang chọn ML làm giải pháp nên ở bước xây dựng dự án POC này, chúng ta sẽ đi chứng minh rằng giải pháp ML là khả thi.

## Định nghĩa POC

Trong quá trình phân tích vấn đề kinh doanh, chúng ta đã tổng hợp được thông tin về data và quá trình xây dựng ML model như sau.

| Câu hỏi                                            | Trả lời                                                                                                           |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Data được lấy từ đâu?                              | Đã được tổng hợp bởi Data Engineer từ ứng dụng của công ty                                                        |
| Data sẽ được transform, clean, và lưu trữ thế nào? | Data đã được Data Engineer xử lý để thực hiện POC trước, format là `parquet`, tạm thời lưu ở Database của công ty |
| Các feature tiềm năng là gì?                       | conv_rate, acc_rate, avg_daily_trips                                                                              |
| Các model architecture tiềm năng?                  | Linear Regression, Elastic Net                                                                                    |
| Dùng metrics nào để đánh giá model?                | MSE, RMSE, R2                                                                                                     |

Ở bước xây dựng dự án POC này, chúng ta cần trả lời thêm một câu hỏi nữa, đó là: _Thế nào là một dự án POC thành công?_

Vì những dự án POC đầu tiên chưa thể đưa ML model ra môi trường production để trích xuất ra metric cuối cùng để đánh giá ML model được, nên chúng ta cần phải sử dụng metrics đã được định nghĩa ở trên để đánh giá ML model. Cụ thể, chúng ta cần phải đặt một threshold cho các metrics này. Trong khoá học này, chúng ta sử dụng metric RMSE, và threshold để định nghĩa dự án POC thành công là RMSE phải nhỏ hơn **0.6**.

Lưu ý: dự án POC chỉ là một vòng lặp khi xây dựng hệ thống. Ở những dự án POC đầu tiên, cách đánh giá model có thể chỉ là dùng offline metric. Càng về các giai đoạn sau, khi hệ thống đã được triển khai ra production, các online metric sẽ được dùng để đánh giá giải pháp ở giai đoạn đó.

Lưu ý: Một số metric khác được sử dụng như:

-   Sử dụng cả metric Accuracy, F1, AUC để đánh giá model performance
-   Sử dụng thời gian training và inference của ML model để so sánh chi phí và lợi ích

Sau khi đã định nghĩa được thế nào là một dự án POC thành công, ở bước tiếp theo, chúng ta sẽ bắt tay vào thực hiện dự án POC.
