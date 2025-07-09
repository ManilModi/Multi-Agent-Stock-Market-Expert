from etl_pipeline import extract_data, extract_index_data, transform_data

if __name__ == "__main__":
    extract_data('Tata Motors', 'TATAMOTORS')
    extract_index_data('NIFTY 50', 'NIFTY')
    transform_data(
        'tata_motors_candles_angel.csv',
        'nifty_50_candles_angel.csv',
        'tata_motors_dataset_enriched.csv'
    )
