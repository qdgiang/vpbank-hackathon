import boto3
import os
import logging
from typing import List, Dict, Any
logger = logging.getLogger()
logger.setLevel(logging.INFO)

bedrock_agent_runtime_client = boto3.client('bedrock-agent-runtime', region_name = os.environ.get("REGION_NAME", "ap-southeast-2"))
KNOWLEDGE_BASE_ID = os.environ.get("KNOWLEDGE_BASE_ID", "TARE1HFTXP")

def retrieve_financial_products(query: str, user_id: str) -> List[Dict[str, Any]]:
    if not KNOWLEDGE_BASE_ID:
        logger.error("KNOWLEDGE_BASE_ID environment variable is not set.")
        raise ValueError("Knowledge Base ID is not configured.")

    logger.info(f"Retrieving information from KB {KNOWLEDGE_BASE_ID} for query: '{query}'")

    try:
        retrieval_response = bedrock_agent_runtime_client.retrieve(
            knowledgeBaseId=KNOWLEDGE_BASE_ID,
            retrievalQuery={'text': query},
            retrievalConfiguration={
                'vectorSearchConfiguration': {
                    'numberOfResults': 10,
                    'overrideSearchType': 'HYBRID'
                }
            }
        )
        
        retrieved_chunks = retrieval_response.get('retrievalResults', [])
        logger.info(f"Retrieved {len(retrieved_chunks)} chunks from Knowledge Base.")
        
        formatted_results = [
            {
                "source": chunk.get('location', {}).get('s3Location', {}).get('uri'),
                "content": chunk.get('content', {}).get('text'),
                "score": chunk.get('score')
            }
            for chunk in retrieved_chunks
        ]
        
        return formatted_results

    except Exception as e:
        logger.error(f"Error retrieving from Knowledge Base: {e}")
        return []
