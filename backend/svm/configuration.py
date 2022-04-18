# Active Learning Configuration:
MIN_TRAINING_SIZE = 4 # the minimum number of patents required to train the model.
N_COMPONENTS = 2 # minimum number of features for the truncated svm. N_COMPONENTS < MIN_TRAINING_SIZE.

F1_SCORE_MAX = 10 # the number of f1 scores to save in the database.
F1_SCORE_INTERVAL = 10 # the number of training cycles before a new f1_score is calculated and stored.
MIN_AUTO_SAVE_CYCLES = 10 # the minimum number of training cycles before the model is auto-saved to a file.

UNCERTAIN_SAMPLE_SIZE = 500 # number of patents to predict on when performing uncertainty sampling.
UNCERTAIN_SAMPLE_PERCENT = 0.25 # the percent to pick from of the ones sampled.

SAVE_WORKING_MODEL_AT_SHUTDOWN = True # this saves the current model at shutdown regardless of how many training cycles have passed.
# this is useful for switching from the base model to the working model even if MIN_AUTO_SAVE_CYCLES has not been met.