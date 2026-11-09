import logging

from backend.app.repositories import firestore_repository as repo

logging.basicConfig(level=logging.INFO)

# Replace with the collection name T1 approved for this test.
TEST_COLLECTION = 'connectivity_tests'


def main():
    doc_id = repo.create_document(
        TEST_COLLECTION,
        {'message': 'hello from Teammate 3', 'created_at_utc': repo.utc_now()},
    )
    print('Wrote document:', doc_id)

    data = repo.get_document(TEST_COLLECTION, doc_id)
    print('Read back:', data)

    repo.delete_document(TEST_COLLECTION, doc_id)
    still_there = repo.get_document(TEST_COLLECTION, doc_id) is not None
    print('Deleted. Still exists?', still_there)


if __name__ == '__main__':
    main()
