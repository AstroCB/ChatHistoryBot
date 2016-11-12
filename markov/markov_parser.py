import markovify

authors = ["yiyi.txt", "larry.txt", "cam.txt", "jonah.txt", "ghoul.txt"]

for a in authors:
    with open(a) as f:
        model = markovify.Text(f.read())
        with open("../markov_sentences/" + a, "w") as d:
            mark = model.make_short_sentence(320) # Messenger length limit
            while mark is not None:
                d.write(mark + "\n")
                mark = model.make_sentence()
