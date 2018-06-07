import scan
import os
import string
import sys

tmps = scan.get_templates()

def read_img(name):
    # url='https://zhjw.neu.edu.cn/ACTIONVALIDATERANDOMPICTURE.APPPROCESS?id='+urlappend
    res = scan.scan_code(name, tmps)
    os.remove(name)
    return eval(res)


if(len(sys.argv) == 2):
    print(read_img(sys.argv[1]))
else:
    print(read_img(""))
sys.stdout.flush()
