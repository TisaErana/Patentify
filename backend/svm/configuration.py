# Active Learning Configuration:
MIN_TRAINING_SIZE = 4 # the minimum number of patents required to train the model.
N_COMPONENTS = 2 # minimum number of features for the truncated svm. N_COMPONENTS < MIN_TRAINING_SIZE
MIN_AUTO_SAVE_CYCLES = 10 # the minimum number of training cycles before the model is auto-saved to a file.