### Tổng quan về feature store
Feature store là một hệ thống giúp lưu trữ, tương tác và quản lý feature. Công cụ này sinh ra để giải quyết vấn đề về:

- **Feature reuse:** lưu trữ các feature đã được tạo ra để tái sử dụng khi cần thiết
- **Feature sharing:** chia sẻ feature giữa các thành viên trong team hoặc với nhiều team khác nhau
- **Feature consistency:** một nguồn dữ liệu cho cả mục đích training và serving
- **Feature monitoring:** theo dõi drift và chất lượng dữ liệu trước khi đưa qua model sử dụng
- **Data leakage:** đảm bảo không xảy ra hiện tượng leak dữ liệu trong tập training. Ví dụ: dữ liệu training vào thời điểm bất kỳ không được bao gồm dữ liệu mà có timestamp sau đó.

Có rất nhiều feature store ở thời điểm hiện tại, có thể kể tới một số như:

- **Open-source:** Feast, Hopsworks
- **Trả phí:** Tecton (Feast phiên bản enterprise), Hopworks (phiên bản enterprise), Amazon SageMaker Feature Store, Vertex AI Feature Store

### Feast
Ở series này chúng ta sẽ tìm hiểu về feature store thông qua [Feast](https://feast.dev/).

Feast có 2 loại stores là:

- **Offline store:** lưu trữ dữ liệu lịch sử để phục vụ mục đích training hoặc offline batch serving. Hiện tại Feast hỗ trợ chọn một trong loại data source sau để làm offline store: File, Snowflake, Bigquery và Redshift. Ngoài ra còn các loại khác được contribute bởi cộng đồng ví dụ như PostgreSQL, Spark, Trino, .v.v.., tuy nhiên nên hạn chế dùng vì chưa đạt full test coverage.

- **Online store:** lưu trữ dữ liệu mới nhất cho mỗi ID. Store này cần có khả năng serve với low latency để sử dụng cho online serving. Các loại data source mà Feast hỗ trợ để làm online store bao gồm: SQLite, Snowflake, Redis, MongoDB và Datastore. Các loại khác contribute bởi cộng đồng có thể kể đến như PostgreSQL và Cassandra + Astra DB.

Tất cả các config cho Feast bao gồm data source cho mỗi loại store, định nghĩa các feature và entity (ID) nằm trong folder sau:

```
feature_repo
├── data_sources.py: định nghĩa các data source
├── entities.py: định nghĩa entity
├── features.py: định nghĩa các bảng feature, và các feature cùng kiểu dữ liệu trong từng bảng
└── feature_store.yaml: định nghĩa loại data source và đường dẫn tới feature definition object store
```

Hãy cùng tìm hiểu sâu hơn các file nào

```py title="data_sources.py" linenums="1"
driver_stats_view = FeatureView(
    name="driver_stats",
    description="driver features",
    entities=[driver], # (1)
    ttl=timedelta(days=36500),  # (2)
    schema=[
        Field(name="conv_rate", dtype=Float32),
        Field(name="acc_rate", dtype=Float32),
        Field(name="avg_daily_trips", dtype=Int32),
    ],
    online=True,
    source=driver_stats_batch_source,
    tags={},
    owner="mlopsvn@gmail.com",
)

@stream_feature_view(
    entities=[driver],
    ttl=timedelta(days=36500),
    mode="spark",
    schema=[
        Field(name="conv_rate", dtype=Float32),
        Field(name="acc_rate", dtype=Float32),
    ],
    timestamp_field="datetime",
    online=True,
    source=driver_stats_stream_source,
    tags={},
    owner="stream_source_owner@gmail.com",
)
def driver_stats_stream(df: DataFrame):
    from pyspark.sql.functions import col

    return (
        df.withColumn("conv_percentage", col("conv_rate") * 100.0)
        .withColumn("acc_percentage", col("acc_rate") * 100.0)
        .drop("conv_rate", "acc_rate")
        .withColumnRenamed("conv_percentage", "conv_rate")
        .withColumnRenamed("acc_percentage", "acc_rate")
    )
```

1.  Định nghĩa entity cho bảng feature
2.  **Time-to-live:** Thời gian sử dụng của feature trước khi bị stale

Các tương tác chính với Feast trong bài giảng:

<img src="../../../assets/images/mlops-crash-course/data-pipeline/Feast_architecture.png" loading="lazy" />

1. Data scientists, training pipeline hoặc offline batch serving pipeline kéo dữ liệu từ offline store về để training
