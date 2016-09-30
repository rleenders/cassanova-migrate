set -ev

# Run a cassandra container
docker run --name cassandra -d -p 9042:9042 cassandra:2.2.5

# Wait Cassandra to create its internal database
echo "Waiting Cassandra to be available"
until docker run --link cassandra:cassandra --rm cassandra:2.2.5 cqlsh cassandra 2>/dev/null 
do
	echo -n "."
	sleep 1
done
echo "."

# Exec lint
npm run lint

# Exec unit test
npm run test

# Exec coverage
npm run coverage
