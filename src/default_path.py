# -*- coding: utf-8 -*-
"""
Created on Fri Dec  4 11:34:45 2020

@author: Duc
"""
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()

import os

DATA_DIR = Path(os.getenv('DATA_DIR', ''))