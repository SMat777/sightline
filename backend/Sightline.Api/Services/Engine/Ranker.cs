using Sightline.Api.Domain;

namespace Sightline.Api.Services.Engine;

// Composite interestingness + an editor's diversity pass so the feed mixes
// signal types instead of stacking five of the same at the top.
public sealed class Ranker
{
    public IReadOnlyList<Finding> Rank(IEnumerable<Finding> findings, int top = 12)
    {
        var scored = findings
            .Select(f => f with { Interessanthed = f.Interessanthed with { Score = Composite(f.Interessanthed) } })
            .OrderByDescending(f => f.Interessanthed.Score)
            .ToList();

        var seen = new Dictionary<FindingType, int>();
        return scored
            .Select(f =>
            {
                var prior = seen.GetValueOrDefault(f.Type);
                seen[f.Type] = prior + 1;
                return (Finding: f, Adjusted: f.Interessanthed.Score * Math.Pow(0.85, prior));
            })
            .OrderByDescending(x => x.Adjusted)
            .Select(x => x.Finding)
            .Take(top)
            .ToList();
    }

    private static double Composite(Interestingness i) =>
        0.35 * i.Styrke + 0.30 * i.Overraskelse + 0.20 * i.Sikkerhed + 0.15 * i.Daekning;
}
