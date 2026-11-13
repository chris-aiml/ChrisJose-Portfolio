import sys
from PIL import Image
out, cols, *files = sys.argv[1], int(sys.argv[2]), *sys.argv[3:]
ims=[Image.open(f).convert('RGB') for f in files]
w,h=ims[0].size; sc=0.5 if w>1000 else 0.8
tw,th=int(w*sc),int(h*sc); rows=(len(ims)+cols-1)//cols
M=Image.new('RGB',(tw*cols,th*rows),(0,0,0))
for i,im in enumerate(ims): M.paste(im.resize((tw,th)),((i%cols)*tw,(i//cols)*th))
M.save(out)
