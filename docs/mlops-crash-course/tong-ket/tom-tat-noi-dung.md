<figure>
    <img src="../../assets/images/mlops-crash-course/tong-ket/ending_meme.jpg" loading="lazy"/>
</figure>

## Tóm tắt nội dung khóa học

Chúng ta đã cùng nhau đi qua một chặng đường dài, từ lúc làm rõ bài toán kinh doanh, thực hiện POC chứng minh hiệu quả của model, tiếp tới là xây dựng các data pipeline, training pipeline, sau đó đóng gói để serve model và cuối cùng là tự động hóa tất cả các bước trên. Trong suốt cả quãng đường này, đã cùng nhau làm quen với rất nhiều tool, đi kèm với best practices được đúc kết và thu thập từ nhiều nguồn tài liệu khác nhau có thể kể tới như Airflow, MLFLow, Feast, .v.v. Việc học cách sử dụng các tool này là cần thiết, song không nên quá phụ thuộc hay lạm dụng nó mà quên đi vấn đề chính là làm thế nào để giải quyết bài toán một cách đơn giản và hiệu quả nhất.

Đồng thời chúng ta đã tìm hiểu về kiểm thử trong một hệ thống ML, nó không đơn thuần chỉ là kiểm thử code như bên software, mà chúng ta còn phải quan tâm tới data và model nữa. Việc làm này quan trọng như là xây dựng model vậy, vì nếu không có kiểm thử thì đầu ra sẽ không thể tin cậy được (garbage in - garbage out).

Feature store cũng là một thành phần thú vị trong chuỗi bài giảng của chúng ta. Nó đang xuất hiện ngày càng nhiều ở các công ty, giúp cho việc quản lý, đánh giá và chia sẻ feature một cách dễ dàng giữa các thành viên trong team, giữa các team trong toàn tổ chức. Ứng dụng này sẽ giảm thiểu rất nhiều công sức của bạn, bên cạnh đó việc làm này vô cùng tiềm năng trong lúc cải thiện chất lượng model thông qua việc nâng cao chất lượng feature.

Nhìn xa hơn nữa, các tool mà chúng ta đã deploy tạo nên một MLOps platform, có tính tái sử dụng ở nhiều dự án ML khác nhau, đặt ra một quy chuẩn trong việc thiết kế và xây dựng hệ thống ML, đồng thời giảm thiểu tối đa các công việc trùng lặp giữa nhiều team với nhau.

## Dọn dẹp môi trường phát triển

Để dọn dẹp môi trường phát triển, bạn làm theo các bước sau:

1.  Teardown `mlops-platform`

    ```bash
    cd mlops-crash-course-platform
    bash run.sh all down --volumes
    ```

1.  Stop các service khác

    ```bash
    cd mlops-crash-course-code
    make -C model_serving compose_down
    make -C monitoring_service compose_down
    cd stream_emitting && bash deploy.sh stop
    ```

1.  Xoá hoàn toàn data của các services

    1. Trong repo `mlops-crash-course-platform`, xoá toàn bộ folders/files trong folder `airflow/run_env`, trừ file `.gitkeep`
    1. Làm tương tự với các services khác

## Các hướng phát triển tiếp theo

Sau khi hoàn thành khóa học này, bạn hoàn toàn có thể tự học thêm bằng cách:

- **Tập dữ liệu:**

      - Thử nghiệm với tập dữ liệu phức tạp hơn, với nhiều dòng và nhiều cột hơn
      - Cải thiện các bước preprocess/postprocess bằng những xử lý phức tạp hơn

- **Model serving:**

      - Thực hiện các loại deployment khác nhau, ví dụ canary hoặc shadow
      - Thực hiện A/B hoặc multi-armed bandits testing

- **Pipeline:** Thực hiện trigger pipeline thông qua Alert Manager thay vì chạy định kỳ

- **Logging:** Lưu thêm log từ các pipelines, thay vì chỉ model serving

- **CI/CD:** Thực hiện trên nhiều môi trường khác nhau

- **Infrastructure:** Triển khai hệ thống trên Kubernetes
