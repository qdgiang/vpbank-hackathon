import os
import sys
import logging
import sagemaker, boto3
from sagemaker import get_execution_role, Session
from sagemaker.processing import ScriptProcessor, ProcessingInput, ProcessingOutput
from sagemaker.tensorflow import TensorFlow

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# ----- Config AWS ------
AWS_PROFILE = os.getenv("AWS_PROFILE")
AWS_REGION = os.getenv("AWS_REGION")
SAGEMAKER_ROLE = os.getenv("SAGEMAKER_ROLE")
IMAGE_URI = os.getenv("IMAGE_URI")
SAGEMAKER_INSTANCE = os.getenv("SAGEMAKER_JOB_INSTANCE")
SAGEMAKER_GPU_INSTANCE = os.getenv("SAGEMAKER_JOB_GPU_INSTANCE")

# ----- Config PATHs ----
S3_BUCKET = os.getenv("S3_BUCKET")
S3_INPUT_URI  = f"s3://{S3_BUCKET}/preprocessed/"
S3_OUTPUT_URI = f"s3://{S3_BUCKET}/classifier_output/"

def main():
    # Create session
    boto_session = boto3.Session(
        profile_name=AWS_PROFILE,
        region_name=AWS_REGION
    )
    sagemaker_session = Session(boto_session=boto_session)
    logger.info('Created SageMaker Session')

    # Create Estimator
    keras_estimator = TensorFlow(
        entry_point       = "train_classifier.py",
        source_dir        = "scripts",
        output_path       = S3_OUTPUT_URI,
        role              = SAGEMAKER_ROLE,
        instance_count    = 1,
        instance_type     = SAGEMAKER_INSTANCE,
        framework_version = "2.14",
        py_version        = "py310",
        script_mode       = True,
        base_job_name     = "train-classifier",
        sagemaker_session = sagemaker_session,
        hyperparameters   = {
            "epochs"             : 30,
            "emb-batch-size"     : 25,
            "training-batch-size": 512,
            "hidden-units"       : 128,
            "feature-group-name" : "user-embeddings",
            "bucket"             : S3_BUCKET
        },
    )
    logger.info('Created Keras Estimator')

    # Run training job
    try:
        keras_estimator.fit(
            inputs={"train": sagemaker.inputs.TrainingInput(
                s3_data=S3_INPUT_URI, content_type="text/csv")}
        )
        logger.info('Trained Keras Estimator')
    except Exception as e:
        logger.error(f'Training job failed: {e}')

if __name__ == '__main__':
    main()
