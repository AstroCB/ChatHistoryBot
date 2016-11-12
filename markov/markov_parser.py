import markovify

authors = ["yiyi.txt", "larry.txt", "cam.txt"]#, "jonah.txt", "ghoul.txt"]

for a in authors:
    with open(a) as f:
        model = markovify.Text(f.read())
        with open("../markov_sentences/" + a, "w") as d:
            mark = model.make_short_sentence(320) # Messenger length limit
            counter = 0 # Limit # of messages to prevent infinite loops
            while mark is not None and counter < 50000:
                d.write(mark + "\n")
                mark = model.make_short_sentence(320)
                print(mark)
                counter += 1
