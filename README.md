# Deduplication system for Aleph (Melinda)

System for detecting and removing duplicate marc records.

This repository contains code that is shared between the microservices. High-level documentation of the whole system is also in this repository.


## Micro services

Deduplication system is implemented as micro services. 

### Listener

Listener listens for any changes in Aleph and saves changed records to the datastore. It will also get duplicate candidates from datastore for every changed record and pushes them to the CandidateQueue. So whenever a record is changed, Listener triggers the system to check if there are any duplicate records for the just saved record.

Source: [melinda-deduplication-listener](https://github.com/NatLibFi/melinda-deduplication-listener)


### Datastore

Datastore contains a copy of every record in Aleph. It also has indices for querying duplicate candidates. These services are provided over http api.

Source: [melinda-deduplication-datastore](https://github.com/NatLibFi/melinda-deduplication-datastore)


### Validate

Validate reads duplicate candidates from CandidateQueue and classifies the candidates as a duplicate or not duplicate. Candidates that are classified as duplicate are then pushed to the DuplicateQueue. The duplicate candidate information contains only the record id-numbers, so the actual records are fetched from the Datastore.

Source: [melinda-deduplication-validate](https://github.com/NatLibFi/melinda-deduplication-validate)

### Merge

Merge reads duplicates from DuplicateQueue and merges them in Aleph. In case automatic merging is not possible then the duplicate is pushed into the duplicate database (which is not part of this system).

Source: [melinda-deduplication-merge](https://github.com/NatLibFi/melinda-deduplication-merge)


### Queues

There are 2 queues in the system. One for duplicate candidates (before validate) and another for validated duplicates (before merge). Queues are implemented with RabbitMQ.


## Overview of the flow

![Overview of the flow"](architecture.png "Overview of the flow")


