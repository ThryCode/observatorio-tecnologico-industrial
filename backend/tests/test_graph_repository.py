
import pytest

from app.graph.repository import GraphRepository


class MockRecord:
    def __init__(self, data):
        self._data = data

    def data(self):
        return self._data


class MockResult:
    def __init__(self, records):
        self._records = records
        self._index = 0

    async def single(self):
        return self._records[0] if self._records else None

    async def data(self):
        return [r.data() for r in self._records]

    def __aiter__(self):
        return self

    async def __anext__(self):
        if self._index >= len(self._records):
            raise StopAsyncIteration
        record = self._records[self._index]
        self._index += 1
        return record


class MockSession:
    def __init__(self, records=None):
        self._records = records or []

    async def run(self, query, **kwargs):
        return MockResult(self._records)

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        pass


class MockDriver:
    def session(self):
        return MockSession()


@pytest.mark.asyncio
async def test_pagerank():
    mock_records = [
        MockRecord({"id": "org1", "labels": ["Organization"], "props": {"nombre": "Org1"}}),
        MockRecord({"id": "org2", "labels": ["Organization"], "props": {"nombre": "Org2"}}),
    ]
    driver = MockDriver()
    driver.session = lambda: MockSession(mock_records)

    repo = GraphRepository(driver)
    result = await repo.pagerank(limit=10)

    assert len(result) == 2
    assert result[0]["id"] == "org1"
    assert result[0]["score"] == 1.0


@pytest.mark.asyncio
async def test_pagerank_with_label():
    mock_records = [
        MockRecord({"id": "tech1", "labels": ["Technology"], "props": {"nombre": "Tech1"}}),
    ]
    driver = MockDriver()
    driver.session = lambda: MockSession(mock_records)

    repo = GraphRepository(driver)
    result = await repo.pagerank(label="Technology", limit=5)

    assert len(result) == 1
    assert result[0]["labels"] == ["Technology"]


@pytest.mark.asyncio
async def test_community_detection():
    mock_records = [
        MockRecord({"id": "org1", "labels": ["Organization"], "props": {"nombre": "Org1"}, "connections": 5}),
        MockRecord({"id": "org2", "labels": ["Organization"], "props": {"nombre": "Org2"}, "connections": 3}),
    ]
    driver = MockDriver()
    driver.session = lambda: MockSession(mock_records)

    repo = GraphRepository(driver)
    result = await repo.community_detection(limit=10)

    assert len(result) == 2
    assert result[0]["connections"] == 5
    assert result[0]["community"] == 0


@pytest.mark.asyncio
async def test_knn():
    mock_records = [
        MockRecord({
            "id": "org2", "labels": ["Organization"],
            "props": {"nombre": "Org2"}, "relationship": "FOLLOWS", "strength": 2,
        }),
        MockRecord({
            "id": "tech1", "labels": ["Technology"],
            "props": {"nombre": "Tech1"}, "relationship": "OPERATES_IN", "strength": 1,
        }),
    ]
    driver = MockDriver()
    driver.session = lambda: MockSession(mock_records)

    repo = GraphRepository(driver)
    result = await repo.knn("org1", k=5)

    assert len(result) == 2
    assert result[0]["id"] == "org2"
    assert result[0]["strength"] == 2


@pytest.mark.asyncio
async def test_apoc_available_true():
    class ApocSession:
        async def run(self, query, **kwargs):
            return MockResult([MockRecord({"v": "4.0.0"})])
        async def __aenter__(self):
            return self
        async def __aexit__(self, *args):
            pass

    driver = MockDriver()
    driver.session = lambda: ApocSession()

    repo = GraphRepository(driver)
    result = await repo._apoc_available()
    assert result is True


@pytest.mark.asyncio
async def test_apoc_available_false():
    class FailSession:
        async def run(self, query, **kwargs):
            raise Exception("APOC not available")
        async def __aenter__(self):
            return self
        async def __aexit__(self, *args):
            pass

    driver = MockDriver()
    driver.session = lambda: FailSession()

    repo = GraphRepository(driver)
    result = await repo._apoc_available()
    assert result is False


@pytest.mark.asyncio
async def test_explore_node():
    mock_nodes = [
        {"id": "org1", "labels": ["Organization"], "props": {"nombre": "Org1"}},
        {"id": "tech1", "labels": ["Technology"], "props": {"nombre": "Tech1"}},
    ]
    mock_edges = [
        {"source": "org1", "target": "tech1", "type": "OPERATES_IN"},
    ]

    class ExploreSession:
        async def run(self, query, **kwargs):
            return MockResult([MockRecord({"nodes": mock_nodes, "edges": mock_edges})])
        async def __aenter__(self):
            return self
        async def __aexit__(self, *args):
            pass

    driver = MockDriver()
    driver.session = lambda: ExploreSession()

    repo = GraphRepository(driver)
    result = await repo.explore_node("org1", depth=2)

    assert len(result["nodes"]) == 2
    assert len(result["edges"]) == 1
    assert result["total_nodes"] == 2


@pytest.mark.asyncio
async def test_query_graph_no_sectors():
    mock_nodes = [
        MockRecord({"id": "org1", "codigo": None, "labels": ["Organization"], "props": {"nombre": "Org1"}}),
    ]
    mock_edges = []

    class QuerySession:
        def __init__(self):
            self._call_count = 0
        async def run(self, query, **kwargs):
            self._call_count += 1
            if "count" in query.lower() or "UNWIND" in query:
                return MockResult([MockRecord({"total": 1})])
            if "nodes" in query.lower() or "n.id" in query.lower():
                return MockResult(mock_nodes)
            return MockResult(mock_edges)
        async def __aenter__(self):
            return self
        async def __aexit__(self, *args):
            pass

    driver = MockDriver()
    driver.session = lambda: QuerySession()

    repo = GraphRepository(driver)
    result = await repo.query_graph(limit=100)

    assert "nodes" in result
    assert "edges" in result


@pytest.mark.asyncio
async def test_stats_no_sectors():
    mock_records = [
        MockRecord({"label": "Organization", "count": 5}),
        MockRecord({"label": "Technology", "count": 3}),
    ]

    class StatsSession:
        async def run(self, query, **kwargs):
            return MockResult(mock_records)
        async def __aenter__(self):
            return self
        async def __aexit__(self, *args):
            pass

    driver = MockDriver()
    driver.session = lambda: StatsSession()

    repo = GraphRepository(driver)
    result = await repo.stats()

    assert len(result) == 2
    assert result[0]["label"] == "Organization"
    assert result[0]["count"] == 5


@pytest.mark.asyncio
async def test_stats_with_sectors():
    mock_records = [
        MockRecord({"label": "Technology", "count": 2}),
    ]

    class StatsSession:
        async def run(self, query, **kwargs):
            return MockResult(mock_records)
        async def __aenter__(self):
            return self
        async def __aexit__(self, *args):
            pass

    driver = MockDriver()
    driver.session = lambda: StatsSession()

    repo = GraphRepository(driver)
    result = await repo.stats(sector_codigos=["AUT"])

    assert len(result) == 1
    assert result[0]["label"] == "Technology"


@pytest.mark.asyncio
async def test_shortest_path_found():
    mock_record = MockRecord({
        "node_ids": ["n1", "n2"],
        "rel_types": ["CONNECTS"],
        "weight": 1.0,
    })

    class PathSession:
        async def run(self, query, **kwargs):
            return MockResult([mock_record])
        async def __aenter__(self):
            return self
        async def __aexit__(self, *args):
            pass

    driver = MockDriver()
    driver.session = lambda: PathSession()

    repo = GraphRepository(driver)
    result = await repo.shortest_path("n1", "n2")

    assert result is not None
    assert result["node_ids"] == ["n1", "n2"]


@pytest.mark.asyncio
async def test_shortest_path_not_found():
    class EmptySession:
        async def run(self, query, **kwargs):
            return MockResult([])
        async def __aenter__(self):
            return self
        async def __aexit__(self, *args):
            pass

    driver = MockDriver()
    driver.session = lambda: EmptySession()

    repo = GraphRepository(driver)
    result = await repo.shortest_path("n1", "n2")

    assert result is None


@pytest.mark.asyncio
async def test_pagerank_invalid_label():
    repo = GraphRepository(MockDriver())
    with pytest.raises(ValueError, match="Invalid label"):
        await repo.pagerank(label="Organization} DETACH DELETE n //")


@pytest.mark.asyncio
async def test_community_detection_invalid_label():
    repo = GraphRepository(MockDriver())
    with pytest.raises(ValueError, match="Invalid label"):
        await repo.community_detection(label="恶意标签")


@pytest.mark.asyncio
async def test_pagerank_none_label_allowed():
    mock_records = [
        MockRecord({"id": "org1", "labels": ["Organization"], "props": {"nombre": "Org1"}}),
    ]
    driver = MockDriver()
    driver.session = lambda: MockSession(mock_records)

    repo = GraphRepository(driver)
    result = await repo.pagerank(label=None, limit=10)
    assert len(result) == 1


@pytest.mark.asyncio
async def test_community_detection_none_label_allowed():
    mock_records = [
        MockRecord({"id": "org1", "labels": ["Organization"], "props": {"nombre": "Org1"}, "connections": 3}),
    ]
    driver = MockDriver()
    driver.session = lambda: MockSession(mock_records)

    repo = GraphRepository(driver)
    result = await repo.community_detection(label=None, limit=10)
    assert len(result) == 1
