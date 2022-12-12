<figure>
    <img src="../assets/images/mlops-crash-course/index/changing-world.jpg" loading="lazy"/>
    <figcaption>Photo by <a href="https://unsplash.com/@nasa?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">NASA</a> on <a href="https://unsplash.com/s/photos/world?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a></figcaption>
</figure>

## Giới thiệu

Với sự phát triển mạnh mẽ của điện toán đám mây (Cloud Computing), sự bùng nổ của dữ liệu lớn (Big Data) và sự phát triển không ngừng nghỉ của khoa học công nghệ, học máy (Machine Learning - ML) đã và đang được ứng dụng rộng rãi ở nhiều ngành nghề khác nhau. Vấn đề nảy sinh là làm thế nào để tăng hiệu năng (performance), độ tin cậy (reliability) của các ứng dụng ML và giảm thiểu thời gian ra sản phẩm/thị trường (_go-to-market_) của quá trình xây dựng và ứng dụng AI/ML.

Từ đó, một loạt các quy chuẩn về cách vận hành, triển khai các dự án ML dần được hình thành, mở ra một hướng đi hoàn toàn mới cho Machine Learning Engineer và Data Scientist, đó là **Machine Learning Operations** hay chính là **MLOps**. Với mong muốn thúc đẩy quá trình đưa các sản phẩm ML ra thực tế (production) nhanh chóng và hiệu quả hơn, _MLOpsVN_ đã cho ra đời khoá học **MLOps Crash Course**.

Khoá học được tạo ra với 3 tôn chỉ: **_ngắn gọn_, _dễ hiểu_, _thực tế_**. Trong suốt cả khóa học, chúng ta sẽ cùng nhau tìm hiểu và giải quyết một bài toán thực tế cụ thể, từ bước phân tích yêu cầu cho đến thiết kế và triển khai hệ thống. Khoá học cũng sẽ bao gồm các cách thức tốt nhất (best practices) được tổng hợp từ nhiều hệ thống ML trong các tổ chức lớn, nhiều kĩ sư có kinh nghiệm triển khai các dự án ML trong thực tế từ nhiều nơi trên thế giới. Tài liệu tạo ra chắc chắn không tránh khỏi thiếu sót, rất mong nhận được sự đóng góp của các bạn. Cách thức đóng góp vui lòng xem [tại đây](../CONTRIBUTING.html).

<hr style="margin-top: 2rem; margin-bottom: 2rem;">

MLOpsVN Team xin gửi lời cảm ơn chân thành tới các _Reviewers_ và _Advisors_ tới từ [cộng đồng MLOpsVN](https://www.facebook.com/groups/mlopsvn) đã dành thời gian và công sức đóng góp ý kiến cho khoá học. Khoá học **MLOps Crash Course** sẽ không thể hoàn thành nếu thiếu phản hồi của các bạn.

## Instructors

<div class="multi-bio-cards">
    <div class="bio-card">
        <img src="../assets/images/mlops-crash-course/index/tung-dao.jpg" loading="lazy" class="bio-avatar"/>
        <div class="bio-title">Tung Dao</div>
        <a class="bio-social-link" href="https://www.linkedin.com/in/tungdao17/" target="_blank">
            <object class="bio-social-icon" type="image/svg+xml" data="../assets/images/mlops-crash-course/index/linkedin.svg"></object>
        </a>
        <a class="bio-social-link" href="https://github.com/dao-duc-tung" target="_blank">
            <object class="bio-social-icon" type="image/svg+xml" data="../assets/images/mlops-crash-course/index/github.svg"></object>
        </a>
    </div>
    <div class="bio-card">
        <img src="../assets/images/mlops-crash-course/index/quan-dang.jpeg" loading="lazy" class="bio-avatar"/>
        <div class="bio-title">Quan Dang</div>
        <a class="bio-social-link" href="https://www.linkedin.com/in/quan-dang/" target="_blank">
            <object class="bio-social-icon" type="image/svg+xml" data="../assets/images/mlops-crash-course/index/linkedin.svg"></object>
        </a>
        <a class="bio-social-link" href="https://github.com/quan-dang" target="_blank">
            <object class="bio-social-icon" type="image/svg+xml" data="../assets/images/mlops-crash-course/index/github.svg"></object>
        </a>
    </div>
</div>

## Advisors

<div class="multi-bio-cards">
    <div class="bio-card">
        <img src="../assets/images/mlops-crash-course/index/xuan-son-vu.png" loading="lazy" class="bio-avatar"/>
        <div class="bio-title">
            <a href="https://people.cs.umu.se/sonvx/" target="_blank">
                Xuan-Son Vu
            </a>
        </div>
        <div class="bio-sub-title">Senior Researcher</div>
        <div class="bio-sub-title">Umeå University, Sweden</div>
    </div>
    <div class="bio-card">
        <img src="../assets/images/mlops-crash-course/index/harry-nguyen.jpeg" loading="lazy" class="bio-avatar"/>
        <div class="bio-title">
            <a href="https://www.gla.ac.uk/schools/computing/staff/index.html/staffcontact/person/4edfeeed8696#" target="_blank">
                Harry Nguyen
            </a>
        </div>
        <div class="bio-sub-title">Assistant Professor</div>
        <div class="bio-sub-title">UCC, Ireland</div>
    </div>
</div>

## Reviewers

|                                                                                |                                                                      |                                                      |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------- | ---------------------------------------------------- |
| [ChiT](https://drive.google.com/file/d/17pmBAP7dJbjWH2a4hcSfXpr2HKQlCyiL/view) | [Đặng Văn Thức](#)                                                   | [Đinh Văn Quý](https://www.linkedin.com/in/dvquy/)   |
| [Hải Nguyễn](#)                                                                | [ming đây](#)                                                        | [NguyenDHN](https://www.linkedin.com/in/nguyendhn/)  |
| [PTSon](https://www.linkedin.com/in/phạm-trung-sơn)                            | [QuynhAnhDang](https://www.linkedin.com/in/quynh-anh-dang-688594216) | [Sam Nguyen](https://www.linkedin.com/in/primepake/) |
| [Viet Anh](https://aicurious.io/)                                              |                                                                      |                                                      |
