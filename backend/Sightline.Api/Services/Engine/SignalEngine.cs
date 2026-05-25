using Sightline.Api.Domain;

namespace Sightline.Api.Services.Engine;

public interface ISignalEngine
{
    IReadOnlyList<Finding> Scan(Dataset ds);
}

// Runs every registered scanner over the dataset, then ranks the union.
public sealed class SignalEngine : ISignalEngine
{
    private readonly IEnumerable<ISignalScanner> _scanners;
    private readonly Ranker _ranker;

    public SignalEngine(IEnumerable<ISignalScanner> scanners, Ranker ranker)
    {
        _scanners = scanners;
        _ranker = ranker;
    }

    public IReadOnlyList<Finding> Scan(Dataset ds) =>
        _ranker.Rank(_scanners.SelectMany(s => s.Scan(ds)));
}
