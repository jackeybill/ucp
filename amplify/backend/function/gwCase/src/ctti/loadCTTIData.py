import urllib
import boto3
import json
import psycopg2

conn = psycopg2.connect(
        host="aact-db.ctti-clinicaltrials.org",
        database="aact",
        user="mi608",
        password=urllib.parse.unquote_plus('Training@123'))


def save_to_dynamodb(item):
    """

    :return:
    """
    dynamodb = boto3.resource('dynamodb')
    # table = dynamodb.Table('studies')
    table = dynamodb.Table('Diabetes')
    response = table.put_item(
        Item=item
    )
    print(response)

def load_indication(nct_id):
    if nct_id:
        cur = conn.cursor()
        sql = "select distinct name from conditions"
        # print(sql)
        cur.execute(sql)
        rows = cur.fetchall()
        # print(rows)
        result = []
        for item in rows:
            # print(item[0])
            result.append(item[0])
        cur.close()
        print(result)
        return result

def load_country(nct_id):
    if nct_id:
        cur = conn.cursor()
        sql = "select distinct country from facilities where nct_id = '%s'" % nct_id
        # print(sql)
        cur.execute(sql)
        rows = cur.fetchall()
        # print(rows)
        result = []
        for item in rows:
            # print(item[0])
            result.append(item[0])
        cur.close()
        print(result)
        return result


def load_criteria(nct_id):
    if nct_id:
        cur = conn.cursor()
        sql = "select distinct criteria from eligibilities where nct_id = '%s'" % nct_id
        # print(sql)
        cur.execute(sql)
        rows = cur.fetchall()
        # print(rows)
        result = []
        for item in rows:
            # print(item[0])
            result.append(item[0])
        cur.close()
        print(result)
        return result


def load_data():

    # cols = ['nct_id', 'nlm_download_date_description', 'study_first_submitted_date', 'results_first_submitted_date',
    #         'disposition_first_submitted_date', 'last_update_submitted_date', 'study_first_submitted_qc_date',
    #         'study_first_posted_date', 'study_first_posted_date_type', 'results_first_submitted_qc_date',
    #         'results_first_posted_date', 'results_first_posted_date_type', 'disposition_first_submitted_qc_date',
    #         'disposition_first_posted_date', 'disposition_first_posted_date_type', 'last_update_submitted_qc_date',
    #         'last_update_posted_date', 'last_update_posted_date_type', 'start_month_year', 'start_date_type',
    #         'start_date', 'verification_month_year', 'verification_date', 'completion_month_year',
    #         'completion_date_type', 'completion_date', 'primary_completion_month_year', 'primary_completion_date_type',
    #         'primary_completion_date', 'target_duration', 'study_type', 'acronym', 'baseline_population', 'brief_title',
    #         'official_title', 'overall_status', 'last_known_status', 'phase', 'enrollment', 'enrollment_type', 'source',
    #         'limitations_and_caveats', 'number_of_arms', 'number_of_groups', 'why_stopped', 'has_expanded_access',
    #         'expanded_access_type_individual', 'expanded_access_type_intermediate', 'expanded_access_type_treatment',
    #         'has_dmc', 'is_fda_regulated_drug', 'is_fda_regulated_device', 'is_unapproved_device', 'is_ppsd',
    #         'is_us_export', 'biospec_retention', 'biospec_description', 'ipd_time_frame', 'ipd_access_criteria',
    #         'ipd_url', 'plan_to_share_ipd', 'plan_to_share_ipd_description', 'created_at', 'updated_at']

    # select s.nct_id, s.brief_title, s.study_type, s.phase, s.is_ppsd as pediatric
    # , c2.name as indication
    # --, f2.country
    # from studies s
    # join conditions c2 on s.nct_id = c2.nct_id
    # -- left join facilities f2 on s.nct_id = f2.nct_id
    # limit 10

    cols = ['s.nct_id', 's.study_type', 's.brief_title', 's.phase', 's.is_ppsd', 'c2.name', 's.official_title', 's.source', 's.enrollment', 's.acronym']
    cols_str = ','.join(cols)
    cur = conn.cursor()
    sql = "SELECT " + cols_str + " FROM ctgov.studies s join ctgov.conditions c2 on s.nct_id = c2.nct_id limit 30;"
    # sql = "SELECT " + cols_str + " FROM ctgov.studies s join ctgov.conditions c2 on s.nct_id = c2.nct_id where c2.\"name\" = 'Type2 Diabetes' and s.study_type = 'Interventional' and s.phase is null limit 500;"
    print('sql=', sql)
    cur.execute(sql)

    # row = cur.fetchone()
    size = 30
    rows = cur.fetchmany(size)
    # rows = cur.fetchmany(size)
    print("The number of rows: ", len(rows))
    cur.close()
    conn.close()

# load_data()
# nct_id = 'NCT04242420'
# load_country(nct_id)
# save_to_dynamodb()
def lambda_handler(event, context):
    print('event=', event)
    load_data()