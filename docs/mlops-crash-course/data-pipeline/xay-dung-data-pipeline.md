Sau khi chạy `feast apply` để tạo ra feature definition ở đường dẫn `registry/local_registry.db`, chúng ta sẽ sử dụng folder này để config client `store` giao tiếp với feature store như sau:

```py linenums="1"
from feast import FeatureStore
store = FeatureStore(repo_path="../feature_repo")  # (1)
```

1.  Khởi tạo client *store* để giao tiếp với feature store

Client này sẽ được sử dụng ở nhiều bước khác nhau bao gồm **1**, **2**, **3**, **4**, **5** như hình dưới đây:

<img src="../../../assets/images/mlops-crash-course/data-pipeline/Feast_architecture.png" loading="lazy" />

Các tương tác chính với Feast:

1. Materialize feature từ offline sang online store để đảm bảo online store lưu trữ feature mới nhất
    ```py title="data_pipeline/scripts/feast_helper.sh" linenums="1"
    cd feature_repo
    feast materialize-incremental $(date +%Y-%m-%d)
    ```

2. Data scientist, training pipeline hoặc offline batch serving pipeline kéo features về để train model
    ```py title="data_pipeline/examples/get_historical_features.py" linenums="1"
    entity_df = pd.DataFrame.from_dict(
        {
            "driver_id": [1001, 1002, 1003, 1004, 1001],
            "datetime": [
                datetime(2022, 4, 12, 10, 59, 42),
                datetime(2022, 4, 12, 8, 12, 10),
                datetime(2022, 4, 12, 16, 40, 26),
                datetime(2022, 4, 12, 15, 1, 12),
                datetime.now(),
            ],
        }
    )
    training_df = store.get_historical_features(
        entity_df=entity_df,
        features=["driver_stats:acc_rate", "driver_stats:conv_rate"],
    ).to_df()
    print(training_df.head())
    ```

3. Kéo features mới nhất tương ứng với các IDs trong request API để cho qua model dự đoán
    ```py title="data_pipeline/examples/get_online_features.py" linenums="1"
    features = store.get_online_features(
        features=[
            "driver_stats:acc_rate",
            "driver_stats:conv_rate"
        ],
        entity_rows=[
            {
                "driver_id": 1001,
            }
        ],
    ).to_dict(include_event_timestamps=True)

    def print_online_features(features):
        for key, value in sorted(features.items()):
            print(key, " : ", value)

    print_online_features(features)
    ```

4. Đẩy stream feature vào offline store
    ```py title="data_pipeline/src/stream_to_stores/processor.py" linenums="1"
    def preprocess_fn(rows: pd.DataFrame):
        print(f"df columns: {rows.columns}")
        print(f"df size: {rows.size}")
        print(f"df preview:\n{rows.head()}")
        return rows

    ingestion_config = SparkProcessorConfig(mode="spark", source="kafka", spark_session=spark, processing_time="30 seconds", query_timeout=15)
    sfv = store.get_stream_feature_view("driver_stats_stream")

    processor = get_stream_processor_object(
        config=ingestion_config,
        fs=store,
        sfv=sfv,
        preprocess_fn=preprocess_fn,
    )

    processor.ingest_stream_feature_view(PushMode.OFFLINE)
    ```

5. Đẩy stream feature vào online store
    ```py linenums="1"
    processor.ingest_stream_feature_view()
    ```

