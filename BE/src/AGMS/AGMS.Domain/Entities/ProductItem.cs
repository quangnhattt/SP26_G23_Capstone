using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AGMS.Domain.Entities
{
    public partial class ProductItem
    {
        public int ProductItemID { get; set; }

        public int ProductID { get; set; }

        public int? LotID { get; set; }

        public string SerialNumber { get; set; } = null!;

        public string Status { get; set; } = null!;

        public DateTime? CreatedDate { get; set; }

        public virtual Product Product { get; set; } = null!;
    }

}
