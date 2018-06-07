import cv2
import numpy as np

def get_templates():
    imgs = [None] * 11
    for i in range(1, 11):
        imgs[i] = cv2.imread('res/' + str(i) + '.jpg', cv2.IMREAD_GRAYSCALE)
    return imgs


def scan_code(path, templates):
    img = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
    _, mask = cv2.threshold(img, 130, 255, cv2.THRESH_BINARY)
    im2 = mask[:, 0:18]
    im3 = mask[:, 18:25]
    im4 = mask[:, 27:45]
    param = [None] * 2
    for i in range(1, 8):
        loc_place1 = np.where(cv2.matchTemplate(im2, templates[i], cv2.TM_CCOEFF_NORMED) > 0.7)
        loc_place2 = np.where(cv2.matchTemplate(im4, templates[i], cv2.TM_CCOEFF_NORMED) > 0.7)
        for pt in zip(*loc_place1[::-1]):
            param[0] = i
        for pt in zip(*loc_place2[::-1]):
            param[1] = i

    op = None
    for i in range(9, 11):
        loc_op = np.where(cv2.matchTemplate(im3, templates[i], cv2.TM_CCOEFF_NORMED) > 0.7)
        for pt in zip(*loc_op[::-1]):
            op = i
    if param[0] == None or param[1] == None:
        return 'failed'
    if op == 9:
        return str(param[0]) + "*" + str(param[1])
    elif op == 10:
        return str(param[0]) + "+" + str(param[1])
    else:
        return 'failed'