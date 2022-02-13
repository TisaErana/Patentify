# Getting Started

* Upgrade pip with admin privileges:
  * ```python -m pip install --upgrade pip ```
* Install [sklearn](https://scikit-learn.org/stable/install.html)
  * ``` pip install -U scikit-learn==0.24.2 ```
  * SVC model is created with version 0.24.1, but: \
    0.24.2 has a lot of what look like important [non-breaking fixes](https://scikit-learn.org/stable/whats_new/v0.24.html).
* Install [pymongo](https://pymongo.readthedocs.io/en/stable/installation.html)
  * ``` pip install pymongo ```
* Install [modAL](https://modal-python.readthedocs.io/en/latest/content/overview/Installation.html)
  * ``` pip install modAL ```
* Make sure you have replication sets enabled:
  * Find your [configuration file](https://docs.mongodb.com/manual/reference/configuration-options/).
  * Add:
    ```
    replication:
      replSetName:  rs1
    ```
  * Restart the MongoDB service.
  * [Windows/Mac] Open MongoDB Compass, click on MongoSH (bottom left), and type:
    ```
    rs.initiate()
    ```
  * Restart the MongoDB service.

# Starting the Active Learning
* ``` python main.py ```

# Running the Active Learning in Production
* Create a systemd service that executes ``` python main.py ```
