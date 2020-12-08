#%%
# -*- coding: utf-8 -*-
"""
Spyder Editor

This is a temporary script file.
"""
from collections import defaultdict
import json

import pandas as pd

from default_path import DATA_DIR


data_root_dir = DATA_DIR / 'top_site_cookie_inspect'
data_dir = data_root_dir / 'crawl_1000'
assert data_dir.exists()

#%%
from tldextract import extract
def get_suffixed_domain(url):
    return '.'.join(extract(url)[1:])

print(get_suffixed_domain('https://www.usnews.com'))

#%%

cookie_data = defaultdict(list)
for site_data_file in data_dir.glob('*'):
    site_data = json.loads(site_data_file.read_text())    
    
    cookies = site_data['cookies']
    print('Num cookies', len(cookies))
    cookie_domains = set()
    for cookie in cookies:
        cookie_domains.add(get_suffixed_domain(cookie['domain'])) # TODO: Do we need full domain?
    print('Num cookie domains', len(cookie_domains))
    
    website = site_data['website']
    print(website)
    cookie_data['website'].append(get_suffixed_domain(website))
    cookie_data['cookie_domains'].append(list(cookie_domains))
    
site_cookie_df = pd.DataFrame(cookie_data)

#%%
print(site_cookie_df)
out_file = data_root_dir / 'site_to_cookies.tsv'
site_cookie_df.to_csv(out_file, sep='\t')
print('Written to', out_file)

#%%
cookie_domain_to_sites = defaultdict(list)
for _, row in site_cookie_df.iterrows():
    for cookie_domain in row['cookie_domains']:
        cookie_domain_to_sites[cookie_domain].append(row['website'])
cookie_site_data = [{'cookie_domain': k, 'websites': v, 'num_websites': len(v)} for k, v in cookie_domain_to_sites.items()]
cookie_site_df = pd.DataFrame(cookie_site_data).sort_values(by=['num_websites'], ascending=False)
print(cookie_site_df)

out_file = data_root_dir / 'cookie_to_sites.tsv'
cookie_site_df.to_csv(out_file, sep='\t', index=False)
print('Written to', out_file)
