from message_data import messages

yiyi = {"name": "yiyi.txt", "data": []}
larry = {"name": "larry.txt", "data": []}
cam = {"name": "cam.txt", "data": []}
jonah = {"name": "jonah.txt", "data": []}
ghoul = {"name": "ghoul.txt", "data": []}

authors = [yiyi, larry, cam, jonah, ghoul]

for m in messages:
    a = m["author"]
    if a == "Yiyi Kuang":
        yiyi["data"].append(m)
    elif a == "Larry Steele":
        larry["data"].append(m)
    elif a == "Cameron Bernhardt":
        cam["data"].append(m)
    elif a == "Jonah Langlieb":
        jonah["data"].append(m)
    else:
        # Unidentified messages are probably Ghoul
        ghoul["data"].append(m)

for a in authors:
    with open("markov/" + a["name"], "w") as f:
        for l in a["data"]:
            f.write(l["text"] + "\n")
