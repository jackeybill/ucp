from PyPDF2 import PdfFileReader, PdfFileWriter
import io
import boto3

s3 = boto3.client('s3')

def splitPDF(bucketName, bucketKey, fileName):    
    # s3.download_file(source_bucket, key, download_path)
    #obj = s3.get_object(Bucket='iso-data-zone', Key='prior-authorization-service-dev/RawDocuments/Patient 1_PA _ Medical Form_final.pdf')
    obj = s3.get_object(Bucket=bucketName, Key=bucketKey)
    #with open("input.pdf", 'rb') as infile:
    with io.BytesIO(obj["Body"].read()) as infile:
        reader = PdfFileReader(infile)
        writer = PdfFileWriter()
        writer.addPage(reader.getPage(0))
        writer.addPage(reader.getPage(1))
        writer.addPage(reader.getPage(2))
        
        writer1 = PdfFileWriter()
        writer1.addPage(reader.getPage(3))
        writer1.addPage(reader.getPage(4))
        writer1.addPage(reader.getPage(5))
        writer1.addPage(reader.getPage(6))
        
        with open('/tmp/output.pdf', 'wb') as outfile:
            writer.write(outfile)
            #s3.put_object(Bucket='iso-data-zone', Key='prior-authorization-service-dev/output.pdf', Body=outfile)
        with open('/tmp/output1.pdf', 'wb') as outfile1:
            writer1.write(outfile1)
    s3.upload_file('/tmp/output.pdf',  bucketName, 'hiapadev/output/pdf/'+fileName+'.PA.pdf')
    s3.upload_file('/tmp/output1.pdf', bucketName, 'hiapadev/output/pdf/'+fileName+'.MF.pdf')
            
    return None