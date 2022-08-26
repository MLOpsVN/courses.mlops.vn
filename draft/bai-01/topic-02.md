# Tổng quan hệ thống - Topic 02

## Phân tích problem

Một ML System cũng chính là một Software system. Khi đi xây dựng một Software system, việc đầu tiên cần làm chính là đi định nghĩa vấn đề, định lượng hoá định nghĩa đó thành các yêu cầu có thể đánh giá được, và đề xuất các giải pháp khả thi để giải quyết các yêu cầu đó. Vấn đề cốt lõi khi đi xây dựng một ML system vẫn là business problem của một tổ chức.

Trong khoá học này, chúng ta giả sử rằng tổ chức của bạn hiểu về ML, và quyết định chọn giải pháp sử dụng ML để giải quyết một business problem công ty: *dự đoán xem tài xế có hoàn thành một cuốc xe hay không?*. Quá trình định nghĩa một business problem bao gồm quá trình trả lời cho nhiều câu hỏi. Bảng dưới đây liệt kê các câu hỏi và các câu trả lời cho vấn đề của chúng ta trong khoá học này.

TODO: Vẽ markdown table từ [gsheet này](https://docs.google.com/spreadsheets/d/117R4m1nc161BVYX3qut8Sk6SR8CCzhk07BS9y9qg5pc/edit#gid=0)

Về timeline của một dự án, hình dưới đây là một ví dụ của một dự án trong thực thế:

TODO: Paste [hình](https://app.diagrams.net/#G1_kqFsxN5brmNlekqu71Z1ThI1HC9PzR8) vô đây

Trong thực thế, một dự án có thể có 1 hoặc nhiều POC. Sau mỗi bước thực hiện POC, business problem lại được định nghĩa rõ ràng hơn, cung cấp nhiều thông tin hơn cho quá trình xây dựng hệ thống. Ở bước Pipelines building, chúng ta không thể xây dựng các pipelines (data pipeline, model development pipeline, deployment pipeline, monitoring pipeline) một lần rồi xong, mà nó là nhiều vòng lặp. Tuỳ thuộc vào trạng thái hiện tại của dự án mà chúng ta sẽ tập trung vào các chức năng tối thiểu trước, sau đó mới đến các chức năng nâng cao như là tự động hoá pipelines, hay tối ưu thời gian chạy, tối ưu bộ nhớ, v.v.

Ngoài các câu hỏi cơ bản ở trên, tuỳ thuộc vào business problem mà sẽ có các vấn đề và các câu hỏi đi kèm khác. Trong bảng trên, nhiều câu trả lời liên quan tới business của công ty, hơn là liên quan tới MLOps, đã được trả lời ngắn gọn. Những câu trả lời này thông thường cần được một nhóm các Data Analyst và Business Strategist dành thời gian thảo luận, phân tích và trả lời.

Ngoài ra, trong quá trình phát triển hệ thống, mọi thành viên trong dự án đều cần chú ý tới bốn tính chất cơ bản của một hệ thống ML, bao gồm Reliability, Scalability, Maintainability, và Adaptability. Các bạn có thể đọc thêm ở khoá học [CS 329S: Machine Learning Systems Design](https://docs.google.com/document/d/1C3dlLmFdYHJmACVkz99lSTUPF4XQbWb_Ah7mPE12Igo/edit#heading=h.f2r0clc6xjgx) để hiểu rõ hơn về bốn tính chất này.

Lưu ý rằng câu trả lời cho các câu hỏi trên sẽ được cập nhật liên tục trong quá trình thực hiện dự án, giống như nhiều vòng lặp. Chúng ta không thể mong đợi rằng mọi thứ sẽ được trả lời đúng ngay từ khi còn chưa bắt đầu thực hiện nó.

Sau khi đã trả lời một loạt các câu hỏi trên, chúng ta đã có một cái nhìn kĩ lưỡng hơn về problem mà chúng ta đang giải quyết. Dựa vào Timeline đã được định nghĩa ở trên, bước tiếp theo chúng ta sẽ thực hiện POC.
