using Contracts;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace internship.Repository
{
    public abstract class RepositoryBase<T> : IRepositoryBase<T> where T : class
    {
        protected AppDbContext RepositoryContext;

        public RepositoryBase(AppDbContext repositoryContext)
            => RepositoryContext = repositoryContext;

        public IQueryable<T> FindAll(bool trackChanges) =>
            !trackChanges ?
                RepositoryContext.Set<T>().AsNoTracking() :
                RepositoryContext.Set<T>();

    }
}