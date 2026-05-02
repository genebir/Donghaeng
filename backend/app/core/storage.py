import boto3
from botocore.client import Config

from app.config import get_settings


def _client():
    s = get_settings()
    kwargs = dict(
        aws_access_key_id=s.s3_access_key,
        aws_secret_access_key=s.s3_secret_key,
        region_name=s.s3_region,
        config=Config(signature_version="s3v4"),
    )
    if s.s3_endpoint_url:
        kwargs["endpoint_url"] = s.s3_endpoint_url
    return boto3.client("s3", **kwargs)


def generate_presigned_put(key: str, content_type: str, expires: int = 600) -> str:
    s = get_settings()
    return _client().generate_presigned_url(
        "put_object",
        Params={"Bucket": s.s3_bucket, "Key": key, "ContentType": content_type},
        ExpiresIn=expires,
    )


def generate_presigned_get(key: str, expires: int = 86400) -> str:
    s = get_settings()
    return _client().generate_presigned_url(
        "get_object",
        Params={"Bucket": s.s3_bucket, "Key": key},
        ExpiresIn=expires,
    )


def make_storage_key(team_id: str, media_id: str, filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "bin"
    return f"teams/{team_id}/media/{media_id}.{ext}"


def delete_object(key: str) -> None:
    s = get_settings()
    _client().delete_object(Bucket=s.s3_bucket, Key=key)
