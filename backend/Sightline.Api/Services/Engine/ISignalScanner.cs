using Sightline.Api.Domain;

namespace Sightline.Api.Services.Engine;

// One signal type. Each scanner reads a profiled dataset and yields findings.
public interface ISignalScanner
{
    IEnumerable<Finding> Scan(Dataset ds);
}
