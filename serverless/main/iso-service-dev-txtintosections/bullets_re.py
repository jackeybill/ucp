import re

bullet_regex_lst = []

#pfizer
bullet_regex_lst.append(r'\n\d{1,3}\.\s')                   # 1. 2. 3.
bullet_regex_lst.append(r'\n\D\.\s')                        # a. b. c. A. B. C. 
#eli_lilly
bullet_regex_lst.append(r'\n[\[][\d{1,3}]+[\]]')            # [1] [2] [3]
bullet_regex_lst.append(r'\n[\[][\d{1,3}]+[a-z][\]]')       # [1a] [1b] [2a]
# random
bullet_regex_lst.append(r'\n[\(][\d{1,3}]+[\)]')            # (1) (2) (3)
bullet_regex_lst.append(r'\n[\d{1,3}]+[\)]')                # 1) 2) 3)
bullet_regex_lst.append(r'\n[\(](?![i])\b[a-zA-Z]\b[\)]')   # (a) (b) (c)                   #r'\n[\(][a-zA-Z][\)]'
bullet_regex_lst.append(r'\n(?![i])\b[a-zA-Z]\b[\)]')       # a) b) c)                      #r'\n+[a-zA-Z]+[\)]'
bullet_regex_lst.append(r'\n[ivx]+\)')                      # i) ii) iii) iv)
bullet_regex_lst.append(r'\n\([ivx]+\)')                    # (i) (ii) (iii) (iv)


def getfirstbullet(text,regex_lst):
    first_re_search,min_index,first_regex = [],len(text),None
    for regex in regex_lst:
        re_search = [m.start() for m in re.finditer(regex, text, re.IGNORECASE)]
        if re_search:
            first_index = re_search[0]
            if first_index < min_index:
                min_index = first_index
                first_regex = regex
                first_re_search = re_search
    return first_regex,first_re_search

def appendtotext(text,index_lst,content):
    res = list(text)
    index_lst.reverse()
    for index in index_lst:
        res.insert(index+1, content) #ignore \n by +1
    return ''.join(res)

def processbullets(text):
    out_text = text
    regex_lst = bullet_regex_lst.copy()
    for i in range(0,len(regex_lst)):
        regex,re_search = getfirstbullet(out_text,regex_lst)
        if regex in regex_lst:
            out_text = appendtotext(out_text,re_search.copy(),'$$$$'+'\t'*i)
            regex_lst.remove(regex)
    out_text = out_text.strip().replace('\n',' ').replace('$$$$','\n')
    try:
        out_dict = processJson(out_text)
    except Exception as e:
        out_dict = {'error':str(e)}
    return out_text,out_dict

def get_indent(line):
    return len(line) - len(line.lstrip())

def nested_set(dic, keys, value):
    for key in keys[:-1]:
        dic = dic.setdefault(key, {})
    #Added for indexes as key
    for regex in bullet_regex_lst:
        regex = regex.replace('\\n','')
        match = re.search(regex,value[:5])
        if match:
            dic[match.group()] = value
            return
    dic[keys[-1]] = value

def processJson(text):
    res = {}
    text_lst = text.splitlines()
    indent_lst = [get_indent(i) for i in text_lst]
    if indent_lst:
        lst = [-1]
        lst.extend([0]*(max(indent_lst)+1))
        prev_indent = -1
        for line in text_lst:
            indent = get_indent(line)
            if indent>=prev_indent:
                lst[indent] += 1
            else:
                lst[indent] += 1
                for z in range(indent+1,len(lst)):
                    lst[z] = 0
            prev_indent = indent
            key = lst[:indent+2]
            nested_set(res, key, line.strip().replace('\n',' '))
        return res
    else:
        res[0] = {"0":text}
        return res

# import json
# text = "Patients are eligible to be included in the study only if they meet all of the following criteria at\nscreening:\nType of Patient and Disease Characteristics\n[1] Men or women diagnosed (clinically) with T2D, based on the World Health\nOrganization (WHO) classification (Appendix 5) for at least 1 year prior to\nscreening\nPatient Characteristics\n[2]\nAre at least 18 years of age\n[3]\nHave been treated for at least 90 days prior to screening with:\na) Basal insulin (insulin glargine U-100 [Basaglar/Abasagla: or LANTUS] or\nU-300, insulin detemir, insulin degludec U-100 or U-200, or NPH insulin)\nin combination with at least 1 prandial injection of bolus insulin (insulin\nlispro U-100 or U-200, insulin aspart, insulin glulisine, or regular insulin)\nOr\nb) Premixed analog or human insulin regimens with any basal and bolus\ninsulin combination injected at least twice daily\n[4]\nPatients may be treated with up to 3 of the following OAMs in accordance with\nlocal regulations:\nMetformin\nDipeptidyl peptidase- 4 (DPP-4) inhibitor\nSodium glucose cotransporter 2 (SGLT2) inhibitor\nSulfonylurea\nMeglitinide\nAlpha-glucoside inhibitor\nDoses of OAMs are required to have been stable for at least 90 days prior to\nscreening. Combination medications (2 or more medications in 1 pill) should be\ncounted as the number of individual components.\nDuring the study lead-in and treatment periods, patients may continue the use of\nup to 2 of the following OAMs: metformin, SGLT2 inhibitor. Other prestudy\nOAMs will be discontinued at the beginning of the lead-in period. Please also\nrefer to management of OAMs in Section 7.7.1.\n[5] Have an HbAlc value between >7.0 and 10.0%, according to the central\nlaboratory at the time of screening (Visit 1).\n[6]\nHave a body mass index (BMI) of <45.0 kg/m² at screening (Visit 1).\n[7]\nMale patients:\na) No male contraception required except in compliance with specific local\ngovernment study requirements.\n[8]\nFemale patients:\na) Women not of childbearing potential may participate and include those who\nare:\ni)\ninfertile due to surgical sterilization (hysterectomy, bilateral\noophorectomy, or tubal ligation), congenital anomaly such as\nMullerian agenesis;\nOr\nii) postmenopausal - defined as either\n(1) a woman 50 to 54 years of age (inclusive) with an intact uterus, not\non hormone therapy who has had either\n(a) cessation of menses for at least 1 year;\nOr\n(b) at least 6 months of spontaneous amenorrhea with a follicle-\nstimulating hormone >40 mIU/mL;\nOr\n(2) a woman 55 or older not on hormone therapy, who has had at least\n6 months of spontaneous amenorrhea;\nOr\n(3) a woman at least 55 years of age with a diagnosis of menopause\nprior to starting hormone replacement therapy.\nb) Women of childbearing potential participating:\ni) Cannot be pregnant or intend to become pregnant,\nii) Cannot be breastfeeding (including the use of a breast pump),\niii) must remain abstinent or use 1 highly effective method of contraception\nor a combination of 2 effective methods of contraception for the entirety\nof the study (Appendix 7),\niv) Test negative for pregnancy at the time of screening (Visit 1). Note: a\nurine pregnancy test is conducted at Visit 8.\n[9]\nHave access to a telephone, or alternative means for close\nmonitoring/communications, and have access to a reliable cellular signal for\ntransmission of the electronic clinical outcomes assessment (eCOA) data\n[10] Have refrigeration in the home or have ready access to refrigeration for storage\nof insulin therapy\n[11] Patient for whom the investigator has determined can be randomized and\nmaintain the treatment regimens based on their previous medical history\nincluding insulin dosing regimens, hypoglycemic episodes, and glycemic\ncontrol.\n[12] Capable of, willing, and desirous to do the following:\na) Inject insulin with the use of an insulin injection device (insulin pen)\naccording to included directions\nb) Perform self-BG monitoring including 10-point SMBG on designated days\nc) Keep records in an eCOA as required by this protocol\nd) Participate in two 4-hour mixed-meal tolerance tests (MMTTs) and consume\na standardized meal for the tests\ne) Follow a suggested algorithm for basal and prandial insulin dose adjustment\nas agreed upon with the investigator\nf) Comply with the use of the study insulin and scheduled visits\n[13] Considered healthy (apart from T2D) upon completion of medical history,\nphysical examination, vital signs, electrocardiogram (ECG), and analysis of\nlaboratory safety variables, as judged by the investigator\nInformed Consent\n[14] Have given written informed consent to participate in this study in accordance\nwith local regulations."
# #text = 'Patients are eligible to be included in the study only if they meet all of the following criteria at\nscreening:\n[7]\nMale patients:\na) No male contraception required except in compliance with specific local\ngovernment study requirements.\n[8]\nFemale patients:\na) Women not of childbearing potential may participate and include those who\nare:\ni)\ninfertile due to surgical sterilization (hysterectomy, bilateral\noophorectomy, or tubal ligation), congenital anomaly such as\nMullerian agenesis;\nOr\nii) postmenopausal - defined as either\n(1) a woman 50 to 54 years of age (inclusive) with an intact uterus, not\non hormone therapy who has had either\n(a) cessation of menses for at least 1 year;\nOr\n(b) at least 6 months of spontaneous amenorrhea with a follicle-\nstimulating hormone >40 mIU/mL;\nOr\n(2) a woman 55 or older not on hormone therapy, who has had at least\n6 months of spontaneous amenorrhea;\nOr\n(3) a woman at least 55 years of age with a diagnosis of menopause\nprior to starting hormone replacement therapy.\nb) Women of childbearing potential participating:\ni) Cannot be pregnant or intend to become pregnant,\nii) Cannot be breastfeeding (including the use of a breast pump),\niii) must remain abstinent or use 1 highly effective method of contraception\nor a combination of 2 effective methods of contraception for the entirety\nof the study (Appendix 7),\niv) Test negative for pregnancy at the time of screening (Visit 1). Note: a\nurine pregnancy test is conducted at Visit 8.\n[9]\nHave access to a telephone, or alternative means for close\nmonitoring/communications, and have access to a reliable cellular signal for\ntransmission of the electronic clinical outcomes assessment (eCOA) data'
# output_text,output_dict = processbullets(text)
# # print(output_dict)
# print(json.dumps(output_dict))