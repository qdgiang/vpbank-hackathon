import os
import sys
import logging
import sagemaker, boto3
from sagemaker import get_execution_role, Session
from sagemaker.processing import ScriptProcessor, ProcessingInput, ProcessingOutput
from sagemaker.tensorflow import TensorFlow

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Config AWS
AWS_PROFILE = os.getenv("AWS_PROFILE")
AWS_REGION = os.getenv("AWS_REGION")
SAGEMAKER_ROLE = os.getenv("SAGEMAKER_ROLE")
IMAGE_URI = os.getenv("IMAGE_URI")
SAGEMAKER_INSTANCE = os.getenv("SAGEMAKER_JOB_INSTANCE")
SAGEMAKER_GPU_INSTANCE = os.getenv("SAGEMAKER_JOB_GPU_INSTANCE")

BUCKET = "test-vpb-hackathon"
S3_INPUT_URI = "s3://test-vpb-hackathon/preprocessed/"
S3_OUTPUT_URI = "s3://test-vpb-hackathon/autoencoder_output/"

EMB_LOCAL_DIR = "/opt/ml/processing/input"
EMB_LOCAL_PATH = "/opt/ml/processing/input/user_embeddings.csv"

def main():
    # Create session
    boto_session = boto3.Session(
        profile_name=AWS_PROFILE,
        region_name=AWS_REGION
    )
    sagemaker_session = Session(boto_session=boto_session)
    logger.info('Created SageMaker Session')
    """
    # Create Estimator
    keras_estimator = TensorFlow(
        entry_point       = "train_autoencoder.py",
        source_dir        = "scripts",
        output_path       = S3_OUTPUT_URI,
        role              = SAGEMAKER_ROLE,
        instance_count    = 1,
        instance_type     = SAGEMAKER_INSTANCE,
        framework_version = "2.14",
        py_version        = "py310",
        script_mode       = True,
        base_job_name     = "train-autoencoder",
        sagemaker_session = sagemaker_session,
        hyperparameters   = {
            "max-seq-len": 50,
            "latent-dim":  64,
            "gru-units":   128,
            "epochs":      60,
        },
    )
    logger.info('Created Keras Estimator')

    # Run training job
    keras_estimator.fit(
        inputs={"train": sagemaker.inputs.TrainingInput(
            s3_data=S3_INPUT_URI, content_type="text/csv")}
    )
    logger.info('Trained Keras Estimator')
    """
    # Get URI of user_embeddings
    #train_job_name = keras_estimator.latest_training_job.name
    train_job_name = 'train-autoencoder-2025-07-13-07-09-46-234'
    emb_s3_uri = f"{S3_OUTPUT_URI}{train_job_name}/output/data/user_embeddings.csv"
    logger.info(f"Embeddings @{emb_s3_uri}")

    # Create processor to ingest to feature-store
    processor = ScriptProcessor(
        image_uri=IMAGE_URI,
        command=["python3"],
        role=SAGEMAKER_ROLE,
        instance_type=SAGEMAKER_INSTANCE,
        instance_count=1,
        base_job_name="feature-store-ingest",
        sagemaker_session=sagemaker_session
    )
    processor.run(
        inputs=[
            ProcessingInput(source=emb_s3_uri,
                            destination=EMB_LOCAL_DIR)
        ],
        code="scripts/ingest_embeddings.py",
        arguments=[
            "--emb-file", EMB_LOCAL_PATH,
            "--feature-group", "user-embeddings",
            "--wait", "true",
            "--region", AWS_REGION,
        ]
    )
    logger.info("🎉 Embeddings ingested")

if __name__ == "__main__":
    main()
